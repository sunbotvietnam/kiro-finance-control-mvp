var SchemaService = (function () {
  function ensureRequiredSheets() {
    Object.keys(SHEET_HEADERS).forEach(function (sheetName) {
      ensureHeaders(sheetName, SHEET_HEADERS[sheetName]);
    });
    seedInitialDataIfEmpty();
    return { ok: true, schemaVersion: getSchemaVersion(), sheets: Object.keys(SHEET_HEADERS) };
  }

  function ensureHeaders(sheetName, headers) {
    var sheet = DataService.getSheet(sheetName);
    var current = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn(), 1)).getValues()[0];
    var needsWrite = headers.some(function (header, i) { return current[i] !== header; });
    if (needsWrite) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#fff3e8');
      sheet.autoResizeColumns(1, headers.length);
    }
  }

  function seedInitialDataIfEmpty() {
    Object.keys(SEED_DATA).forEach(function (sheetName) {
      if (DataService.readRows(sheetName).length > 0) return;
      var headers = SHEET_HEADERS[sheetName];
      SEED_DATA[sheetName].forEach(function (row) {
        var obj = {};
        headers.forEach(function (header, i) { obj[header] = row[i]; });
        if (headers.indexOf('created_at') !== -1 && !obj.created_at) obj.created_at = DataService.nowIso();
        if (headers.indexOf('updated_at') !== -1 && !obj.updated_at) obj.updated_at = DataService.nowIso();
        DataService.appendRow(sheetName, obj);
      });
    });
    seedDefaultUserIfEmpty();
    seedDefaultLoginIfMissing();
  }

  function seedDefaultUserIfEmpty() {
    if (DataService.readRows('AUTH_USERS').length > 0) return;
    var email = Session.getActiveUser().getEmail() || 'owner@example.com';
    DataService.appendRow('AUTH_USERS', {
      user_id: 'USR-OWNER',
      email: email,
      display_name: 'System Owner',
      role_id: 'SYSTEM_OWNER',
      scope_type: 'company',
      region_id: '',
      territory_id: '',
      site_id: '',
      staff_id: '',
      active_status: 'active',
      created_at: DataService.nowIso(),
      updated_at: DataService.nowIso()
    });
  }

  function seedDefaultLoginIfMissing() {
    var users = DataService.readRows('AUTH_USERS');
    if (!users.length) return null;
    var owner = users.find(function (user) { return user.role_id === 'SYSTEM_OWNER'; }) || users[0];
    if (owner.login_id && owner.password_hash && owner.password_salt) return owner;
    var loginId = owner.login_id || 'admin';
    var salt = owner.password_salt || DataService.generateHash([owner.user_id, owner.email, DataService.nowIso()]).slice(0, 16);
    var password = 'Kiro@2026!';
    var updates = {
      login_id: loginId,
      password_salt: salt,
      password_hash: AuthService.hashPassword(loginId, password, salt),
      must_change_password: 'yes',
      updated_at: DataService.nowIso()
    };
    DataService.updateRowByKey('AUTH_USERS', 'user_id', owner.user_id, updates);
    return Object.assign({}, owner, updates);
  }

  function getSchemaVersion() {
    var config = DataService.findByKey('SYSTEM_CONFIG', 'config_key', 'schema_version');
    return config ? config.config_value : APP_CONFIG.SCHEMA_VERSION;
  }

  return {
    ensureRequiredSheets: ensureRequiredSheets,
    ensureHeaders: ensureHeaders,
    seedInitialDataIfEmpty: seedInitialDataIfEmpty,
    seedDefaultLoginIfMissing: seedDefaultLoginIfMissing,
    getSchemaVersion: getSchemaVersion
  };
})();
