var DocumentHookService = (function () {
  function getDocumentById(documentId) {
    return DataService.findByKey('DOCUMENTS', 'document_id', documentId);
  }

  function linkTransactionToDocument(transactionId, documentId) {
    var doc = getDocumentById(documentId);
    if (!doc) throw new Error('Không tìm thấy hồ sơ/chứng từ.');
    var tx = TransactionService.updateTransaction(transactionId, { document_id: documentId });
    AuditService.logAction('link_document', 'TRANSACTIONS', transactionId, null, { document_id: documentId }, 'success', '');
    return tx;
  }

  return {
    getDocumentById: getDocumentById,
    linkTransactionToDocument: linkTransactionToDocument
  };
})();
