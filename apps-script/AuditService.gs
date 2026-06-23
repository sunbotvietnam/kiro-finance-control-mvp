var AuditService = (function () {
  function logAction(action, objectType, objectId, beforeValue, afterValue, status, note) {
    var user = PermissionService.getCurrentUser();
    var auditId = SequenceService.getNextSequence('audit', 'AUD');
    return DataService.appendRow('AUDIT_LOG', {
      audit_id: auditId,
      timestamp: DataService.nowIso(),
      user_id: user.user_id,
      email: user.email,
      role_id: user.role_id,
      action: action,
      object_type: objectType,
      object_id: objectId,
      before_value: beforeValue ? JSON.stringify(beforeValue) : '',
      after_value: afterValue ? JSON.stringify(afterValue) : '',
      status: status || 'success',
      note: note || '',
      user_agent: 'AppsScript'
    });
  }

  function getAuditLogs(filters) {
    return DataService.filterRows('AUDIT_LOG', filters || {});
  }

  return {
    logAction: logAction,
    getAuditLogs: getAuditLogs
  };
})();
