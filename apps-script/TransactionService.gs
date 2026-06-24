var TransactionService = (function () {
  function createTransaction(payload) {
    PermissionService.assertPermission('cash.create_transaction');
    payload = payload || {};
    validatePayload(payload);
    var txId = payload.transaction_id || SequenceService.getNextSequence('transaction', 'TX');
    var date = payload.transaction_date || Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
    var category = payload.category_code ? DataService.findByKey('DM_CATEGORY', 'category_code', payload.category_code) : null;
    var counterparty = payload.counterparty_id ? DataService.findByKey('DM_COUNTERPARTY', 'counterparty_id', payload.counterparty_id) : null;
    var derivedSchoolId = payload.school_id || (counterparty && counterparty.linked_school_id) || '';
    var derivedStaffId = payload.staff_id || (counterparty && counterparty.linked_staff_id) || '';
    var derivedCounterpartyId = payload.counterparty_id || (derivedSchoolId ? derivedSchoolId : '');
    var needsReview = hasReviewGap(Object.assign({}, payload, { counterparty_id: derivedCounterpartyId }), category);
    var sourceSystem = payload.source_system || 'manual';
    var sourceId = payload.source_id || txId;
    var row = {
      transaction_id: txId,
      transaction_date: date,
      period_month: DataService.periodMonth(date),
      tenant_id: payload.tenant_id || APP_CONFIG.DEFAULT_TENANT_ID,
      region_id: payload.region_id || '',
      territory_id: payload.territory_id || '',
      branch: payload.branch || '',
      direction: payload.direction,
      amount: Number(payload.amount),
      currency: payload.currency || APP_CONFIG.DEFAULT_CURRENCY,
      account_id: payload.account_id,
      category_code: payload.category_code || '',
      counterparty_id: derivedCounterpartyId,
      counterparty_name_snapshot: payload.counterparty_name_snapshot || (counterparty ? counterparty.counterparty_name : payload.counterparty_text || ''),
      school_id: derivedSchoolId,
      site_id: payload.site_id || '',
      staff_id: derivedStaffId,
      vendor_id: payload.vendor_id || '',
      partner_id: payload.partner_id || '',
      approval_request_id: payload.approval_request_id || '',
      payment_order_id: payload.payment_order_id || '',
      document_id: payload.document_id || '',
      description: payload.description || '',
      source_system: sourceSystem,
      source_id: sourceId,
      external_ref: payload.external_ref || '',
      duplicate_hash: payload.duplicate_hash || buildDuplicateHash(payload, sourceSystem, sourceId),
      status: payload.status || (needsReview ? 'needs_review' : 'confirmed'),
      match_status: payload.match_status || 'unmatched',
      evidence_status: payload.evidence_status || inferEvidenceStatus(payload, category),
      tax_review_status: payload.tax_review_status || 'not_reviewed',
      created_by: PermissionService.getCurrentUser().email,
      created_at: DataService.nowIso(),
      updated_by: '',
      updated_at: '',
      cancelled_by: '',
      cancelled_at: '',
      cancel_reason: ''
    };
    assertNoDuplicate(row.duplicate_hash);
    DataService.appendRow('TRANSACTIONS', row);
    var taxPayload = TaxService.detectBasicTaxRisk(Object.assign({}, row, { payment_method: payload.payment_method || '' }));
    taxPayload.payment_method = payload.payment_method || '';
    TaxService.createOrUpdateTaxFlags(txId, taxPayload);
    AuditService.logAction('create_transaction', 'TRANSACTIONS', txId, null, row, 'success', '');
    return row;
  }

  function updateTransaction(transactionId, updates) {
    PermissionService.assertPermission('cash.edit_transaction');
    var current = getTransactionById(transactionId);
    if (!current) throw new Error('Không tìm thấy giao dịch.');
    if (['cancelled', 'voided', 'archived'].indexOf(current.status) !== -1) {
      throw new Error('Không sửa giao dịch đã hủy/void/archive.');
    }
    updates = updates || {};
    if (updates.amount !== undefined && Number(updates.amount) <= 0) throw new Error('Số tiền phải lớn hơn 0.');
    if (updates.direction && ENUMS.DIRECTION.indexOf(updates.direction) === -1) throw new Error('Loại giao dịch không hợp lệ.');
    updates.updated_by = PermissionService.getCurrentUser().email;
    updates.updated_at = DataService.nowIso();
    var result = DataService.updateRowByKey('TRANSACTIONS', 'transaction_id', transactionId, updates);
    TaxService.createOrUpdateTaxFlags(transactionId, TaxService.detectBasicTaxRisk(result.after));
    AuditService.logAction('update_transaction', 'TRANSACTIONS', transactionId, result.before, result.after, 'success', '');
    return result.after;
  }

  function cancelTransaction(transactionId, reason) {
    PermissionService.assertPermission('cash.cancel_transaction');
    var current = getTransactionById(transactionId);
    if (!current) throw new Error('Không tìm thấy giao dịch.');
    var updates = {
      status: 'cancelled',
      cancelled_by: PermissionService.getCurrentUser().email,
      cancelled_at: DataService.nowIso(),
      cancel_reason: reason || 'Hủy bởi người dùng',
      updated_by: PermissionService.getCurrentUser().email,
      updated_at: DataService.nowIso()
    };
    var result = DataService.updateRowByKey('TRANSACTIONS', 'transaction_id', transactionId, updates);
    AuditService.logAction('cancel_transaction', 'TRANSACTIONS', transactionId, result.before, result.after, 'success', reason || '');
    return result.after;
  }

  function getTransactions(filters) {
    var rows = PermissionService.applyScope(DataService.readRows('TRANSACTIONS'));
    filters = filters || {};
    var filterPeriod = DataService.normalizePeriodMonth(filters.period_month);
    var dateFrom = normalizeDateFilter(filters.date_from);
    var dateTo = normalizeDateFilter(filters.date_to);
    return rows.filter(function (row) {
      var txDate = normalizeDateFilter(row.transaction_date);
      if (filterPeriod && DataService.normalizePeriodMonth(row.period_month || row.transaction_date) !== filterPeriod) return false;
      if (dateFrom && txDate && txDate < dateFrom) return false;
      if (dateTo && txDate && txDate > dateTo) return false;
      if (filters.direction && row.direction !== filters.direction) return false;
      if (filters.category_code && row.category_code !== filters.category_code) return false;
      if (filters.account_id && row.account_id !== filters.account_id) return false;
      if (filters.counterparty_id && row.counterparty_id !== filters.counterparty_id) return false;
      if (filters.school_id && row.school_id !== filters.school_id) return false;
      if (filters.staff_id && row.staff_id !== filters.staff_id) return false;
      if (filters.evidence_status && row.evidence_status !== filters.evidence_status) return false;
      if (filters.match_status && row.match_status !== filters.match_status) return false;
      if (filters.source_system && row.source_system !== filters.source_system) return false;
      if (filters.status && row.status !== filters.status) return false;
      return true;
    }).sort(function (a, b) {
      return String(b.transaction_date).localeCompare(String(a.transaction_date));
    });
  }

  function getTransactionById(transactionId) {
    return DataService.findByKey('TRANSACTIONS', 'transaction_id', transactionId);
  }

  function calculateBalances(filters) {
    var accounts = MasterDataService.getAccounts();
    var balances = {};
    accounts.forEach(function (account) {
      balances[account.account_id] = {
        account_id: account.account_id,
        account_name: account.account_name,
        opening_balance: Number(account.opening_balance || 0),
        inflow: 0,
        outflow: 0,
        transfer_in: 0,
        transfer_out: 0,
        balance: Number(account.opening_balance || 0)
      };
    });
    getTransactions(filters).forEach(function (tx) {
      if (['cancelled', 'voided', 'archived'].indexOf(tx.status) !== -1) return;
      if (!balances[tx.account_id]) {
        balances[tx.account_id] = { account_id: tx.account_id, account_name: tx.account_id, opening_balance: 0, inflow: 0, outflow: 0, transfer_in: 0, transfer_out: 0, balance: 0 };
      }
      var amount = Number(tx.amount || 0);
      if (tx.direction === 'inflow') {
        balances[tx.account_id].inflow += amount;
        balances[tx.account_id].balance += amount;
      } else if (tx.direction === 'outflow') {
        balances[tx.account_id].outflow += amount;
        balances[tx.account_id].balance -= amount;
      } else if (tx.direction === 'transfer') {
        balances[tx.account_id].transfer_out += amount;
      }
    });
    return Object.keys(balances).map(function (key) { return balances[key]; });
  }

  function calculateCashSummary(filters) {
    var rows = getTransactions(filters).filter(function (tx) {
      return ['cancelled', 'voided', 'archived'].indexOf(tx.status) === -1;
    });
    var summary = { inflow: 0, outflow: 0, transfer: 0, net: 0, available: 0, needs_review: 0, missing_evidence: 0, unmatched: 0 };
    rows.forEach(function (tx) {
      var amount = Number(tx.amount || 0);
      if (tx.direction === 'inflow') summary.inflow += amount;
      if (tx.direction === 'outflow') summary.outflow += amount;
      if (tx.direction === 'transfer') summary.transfer += amount;
      if (tx.status === 'needs_review') summary.needs_review += 1;
      if (['chua_co', 'can_bo_sung', 'khong_hop_le'].indexOf(tx.evidence_status) !== -1) summary.missing_evidence += 1;
      if (tx.match_status === 'unmatched') summary.unmatched += 1;
    });
    summary.net = summary.inflow - summary.outflow;
    summary.available = calculateBalances({}).reduce(function (sum, account) { return sum + Number(account.balance || 0); }, 0);
    return summary;
  }

  function validatePayload(payload) {
    if (!payload.transaction_date) throw new Error('Thiếu ngày phát sinh.');
    if (ENUMS.DIRECTION.indexOf(payload.direction) === -1) throw new Error('Loại giao dịch không hợp lệ.');
    if (Number(payload.amount || 0) <= 0) throw new Error('Số tiền phải lớn hơn 0.');
    if (!payload.account_id) throw new Error('Thiếu tài khoản tiền.');
    if (!payload.category_code) throw new Error('Thiếu mã khoản.');
    if (!payload.description) throw new Error('Thiếu nội dung giao dịch.');
    if (payload.source_system && ENUMS.SOURCE_SYSTEM.indexOf(payload.source_system) === -1) throw new Error('source_system không hợp lệ.');
  }

  function hasReviewGap(payload, category) {
    return !payload.counterparty_id || !payload.account_id || !payload.category_code ||
      (category && String(category.requires_invoice_default) === 'true' && (!payload.evidence_status || payload.evidence_status === 'chua_co'));
  }

  function inferEvidenceStatus(payload, category) {
    if (payload.evidence_status) return payload.evidence_status;
    if (payload.direction === 'transfer') return 'khong_can';
    if (category && String(category.requires_invoice_default) === 'true') return 'chua_co';
    return 'chua_co';
  }

  function buildDuplicateHash(payload, sourceSystem, sourceId) {
    return DataService.generateHash([sourceSystem, sourceId, payload.transaction_date, payload.direction, payload.amount, payload.account_id, payload.description]);
  }

  function normalizeDateFilter(value) {
    if (!value) return '';
    if (Object.prototype.toString.call(value) === '[object Date]') {
      return Utilities.formatDate(value, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
    }
    var text = String(value).trim();
    var iso = text.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    if (iso) return iso[1] + '-' + ('0' + iso[2]).slice(-2) + '-' + ('0' + iso[3]).slice(-2);
    var vn = text.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
    if (vn) return vn[3] + '-' + ('0' + vn[2]).slice(-2) + '-' + ('0' + vn[1]).slice(-2);
    return text.slice(0, 10);
  }

  function assertNoDuplicate(hash) {
    if (!hash) return;
    var exists = DataService.readRows('TRANSACTIONS').find(function (tx) {
      return tx.duplicate_hash === hash && ['cancelled', 'voided'].indexOf(tx.status) === -1;
    });
    if (exists) throw new Error('Có khả năng trùng giao dịch: ' + exists.transaction_id);
  }

  return {
    createTransaction: createTransaction,
    updateTransaction: updateTransaction,
    cancelTransaction: cancelTransaction,
    getTransactions: getTransactions,
    getTransactionById: getTransactionById,
    calculateBalances: calculateBalances,
    calculateCashSummary: calculateCashSummary
  };
})();
