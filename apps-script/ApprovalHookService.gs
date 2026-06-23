var ApprovalHookService = (function () {
  function getApprovalRequestById(approvalRequestId) {
    return DataService.findByKey('APPROVAL_REQUESTS', 'approval_request_id', approvalRequestId);
  }

  function linkTransactionToApprovalRequest(transactionId, approvalRequestId) {
    var approval = getApprovalRequestById(approvalRequestId);
    if (!approval) throw new Error('Không tìm thấy đề xuất chi.');
    var tx = TransactionService.updateTransaction(transactionId, { approval_request_id: approvalRequestId });
    AuditService.logAction('link_approval_request', 'TRANSACTIONS', transactionId, null, { approval_request_id: approvalRequestId }, 'success', '');
    return tx;
  }

  return {
    getApprovalRequestById: getApprovalRequestById,
    linkTransactionToApprovalRequest: linkTransactionToApprovalRequest
  };
})();
