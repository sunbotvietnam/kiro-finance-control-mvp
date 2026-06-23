var MasterDataService = (function () {
  function activeRows(sheetName) {
    return DataService.readRows(sheetName).filter(function (row) {
      return row.active_status !== 'inactive';
    });
  }

  function getCategories() {
    return activeRows('DM_CATEGORY').sort(function (a, b) {
      return Number(a.sort_order || 0) - Number(b.sort_order || 0);
    });
  }

  function getAccounts() {
    return activeRows('DM_ACCOUNT');
  }

  function getStaff() {
    return activeRows('DM_STAFF');
  }

  function getCounterparties() {
    return activeRows('DM_COUNTERPARTY');
  }

  function searchCounterparties(query) {
    var q = DataService.normalizeText(query);
    if (!q) return getCounterparties().slice(0, 30);
    return getCounterparties().filter(function (row) {
      return DataService.normalizeText(row.counterparty_name).indexOf(q) !== -1 ||
        DataService.normalizeText(row.counterparty_id).indexOf(q) !== -1;
    }).slice(0, 30);
  }

  function searchStaff(query) {
    var q = DataService.normalizeText(query);
    if (!q) return getStaff().slice(0, 30);
    return getStaff().filter(function (row) {
      return DataService.normalizeText(row.staff_name).indexOf(q) !== -1 ||
        DataService.normalizeText(row.staff_id).indexOf(q) !== -1;
    }).slice(0, 30);
  }

  function resolveAlias(aliasText) {
    var q = DataService.normalizeText(aliasText);
    if (!q) return null;
    var exact = DataService.readRows('DM_ALIAS_MAP').find(function (row) {
      return row.status === 'approved' && DataService.normalizeText(row.alias_text) === q;
    });
    if (exact) return exact;
    var candidates = DataService.readRows('DM_ALIAS_MAP').filter(function (row) {
      return row.status === 'approved' && DataService.normalizeText(row.alias_text).indexOf(q) !== -1;
    });
    return candidates[0] || null;
  }

  function createAliasMap(payload) {
    PermissionService.assertPermission('system.manage_master_data');
    var aliasId = SequenceService.getNextSequence('alias', 'ALIAS');
    var row = {
      alias_id: aliasId,
      alias_text: payload.alias_text,
      canonical_type: payload.canonical_type,
      canonical_id: payload.canonical_id,
      canonical_name: payload.canonical_name || '',
      confidence: payload.confidence || 0.8,
      source_system: payload.source_system || 'manual',
      status: payload.status || 'pending',
      approved_by: payload.approved_by || '',
      approved_at: payload.approved_at || '',
      created_at: DataService.nowIso()
    };
    DataService.appendRow('DM_ALIAS_MAP', row);
    AuditService.logAction('create_alias', 'DM_ALIAS_MAP', aliasId, null, row, 'success', '');
    return row;
  }

  function getBootstrapData() {
    return {
      categories: getCategories(),
      accounts: getAccounts(),
      staff: getStaff(),
      counterparties: getCounterparties(),
      currentUser: PermissionService.getCurrentUser(),
      enums: ENUMS
    };
  }

  return {
    getCategories: getCategories,
    getAccounts: getAccounts,
    getStaff: getStaff,
    getCounterparties: getCounterparties,
    searchCounterparties: searchCounterparties,
    searchStaff: searchStaff,
    resolveAlias: resolveAlias,
    createAliasMap: createAliasMap,
    getBootstrapData: getBootstrapData
  };
})();
