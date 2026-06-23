var PermissionService = (function () {
  var ROLE_PERMISSIONS = {
    SYSTEM_OWNER: ['*'],
    SYSTEM_ADMIN: ['system.manage_users', 'system.manage_master_data', 'system.view_audit', 'cash.view', 'report.export'],
    EXECUTIVE: ['cash.view', 'report.ceo_compact', 'report.finance_full', 'approval_request.approve', 'notification.receive_alerts'],
    FINANCE_CONTROLLER: ['cash.create_transaction', 'cash.edit_transaction', 'cash.review_transaction', 'cash.cancel_transaction', 'cash.view', 'tax.review', 'evidence.upload', 'evidence.review', 'report.finance_full', 'report.export'],
    FINANCE_STAFF: ['cash.create_transaction', 'cash.edit_transaction', 'cash.review_transaction', 'cash.view', 'evidence.upload', 'report.export'],
    REGIONAL_MANAGER: ['cash.view', 'report.region_summary'],
    SITE_MANAGER: ['cash.view', 'report.site_summary'],
    OPERATION_STAFF: ['cash.view_own', 'evidence.upload_own', 'approval_request.create_own', 'approval_request.view_own', 'notification.receive_own'],
    PARTNER_USER: ['report.partner_summary'],
    VIEWER: ['cash.view']
  };

  function getCurrentUser() {
    var email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || '';
    var user = DataService.findByKey('AUTH_USERS', 'email', email);
    if (user && user.active_status !== 'inactive') return user;
    return {
      user_id: 'USR-MOCK',
      email: email,
      display_name: email,
      role_id: APP_CONFIG.DEFAULT_USER_ROLE,
      scope_type: 'company',
      region_id: '',
      territory_id: '',
      site_id: '',
      staff_id: '',
      active_status: 'active'
    };
  }

  function hasPermission(permission) {
    var role = getCurrentUser().role_id;
    var grants = ROLE_PERMISSIONS[role] || [];
    return grants.indexOf('*') !== -1 || grants.indexOf(permission) !== -1;
  }

  function assertPermission(permission) {
    if (!hasPermission(permission)) {
      throw new Error('Không đủ quyền: ' + permission);
    }
  }

  function applyScope(rows) {
    var user = getCurrentUser();
    if (['SYSTEM_OWNER', 'SYSTEM_ADMIN', 'EXECUTIVE', 'FINANCE_CONTROLLER', 'FINANCE_STAFF'].indexOf(user.role_id) !== -1) {
      return rows;
    }
    if (user.role_id === 'REGIONAL_MANAGER') {
      return rows.filter(function (row) { return !user.region_id || row.region_id === user.region_id; });
    }
    if (user.role_id === 'SITE_MANAGER') {
      return rows.filter(function (row) { return !user.site_id || row.site_id === user.site_id; });
    }
    if (user.role_id === 'OPERATION_STAFF') {
      return rows.filter(function (row) { return user.staff_id && row.staff_id === user.staff_id; });
    }
    if (user.role_id === 'PARTNER_USER') {
      return rows.filter(function (row) { return !user.territory_id || row.territory_id === user.territory_id; });
    }
    return [];
  }

  return {
    getCurrentUser: getCurrentUser,
    hasPermission: hasPermission,
    assertPermission: assertPermission,
    applyScope: applyScope
  };
})();
