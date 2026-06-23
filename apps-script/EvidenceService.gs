var EvidenceService = (function () {
  function addEvidence(payload) {
    PermissionService.assertPermission('evidence.upload');
    payload = payload || {};
    var evidenceId = payload.evidence_id || SequenceService.getNextSequence('evidence', 'EVD');
    var row = {
      evidence_id: evidenceId,
      transaction_id: payload.transaction_id || '',
      approval_request_id: payload.approval_request_id || '',
      payment_order_id: payload.payment_order_id || '',
      source_system: payload.source_system || 'manual',
      source_id: payload.source_id || evidenceId,
      file_link: payload.file_link || '',
      file_type: payload.file_type || '',
      invoice_number: payload.invoice_number || '',
      invoice_date: payload.invoice_date || '',
      invoice_amount: payload.invoice_amount || '',
      supplier_tax_code: payload.supplier_tax_code || '',
      evidence_status: payload.evidence_status || 'da_co',
      validated_by: '',
      validated_at: '',
      note: payload.note || ''
    };
    DataService.appendRow('EVIDENCE', row);
    if (row.transaction_id) {
      TransactionService.updateTransaction(row.transaction_id, { evidence_status: row.evidence_status });
    }
    AuditService.logAction('add_evidence', 'EVIDENCE', evidenceId, null, row, 'success', '');
    return row;
  }

  function updateEvidenceStatus(evidenceId, status) {
    PermissionService.assertPermission('evidence.review');
    var result = DataService.updateRowByKey('EVIDENCE', 'evidence_id', evidenceId, {
      evidence_status: status,
      validated_by: PermissionService.getCurrentUser().email,
      validated_at: DataService.nowIso()
    });
    if (result.after.transaction_id) {
      TransactionService.updateTransaction(result.after.transaction_id, { evidence_status: status });
    }
    AuditService.logAction('update_evidence_status', 'EVIDENCE', evidenceId, result.before, result.after, 'success', status);
    return result.after;
  }

  function getEvidenceByTransaction(transactionId) {
    return DataService.filterRows('EVIDENCE', { transaction_id: transactionId });
  }

  return {
    addEvidence: addEvidence,
    updateEvidenceStatus: updateEvidenceStatus,
    getEvidenceByTransaction: getEvidenceByTransaction
  };
})();
