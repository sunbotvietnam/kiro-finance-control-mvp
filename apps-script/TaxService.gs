var TaxService = (function () {
  function createOrUpdateTaxFlags(transactionId, payload) {
    var existing = DataService.findByKey('TAX_FLAGS', 'transaction_id', transactionId);
    payload = payload || {};
    var row = {
      tax_flag_id: existing ? existing.tax_flag_id : SequenceService.getNextSequence('tax_flag', 'TAX'),
      transaction_id: transactionId,
      approval_request_id: payload.approval_request_id || '',
      payment_order_id: payload.payment_order_id || '',
      invoice_status: payload.invoice_status || 'pending',
      payment_method: payload.payment_method || '',
      non_cash_required: payload.non_cash_required || '',
      payment_proof_status: payload.payment_proof_status || 'pending',
      vat_rate: payload.vat_rate || '',
      vat_amount: payload.vat_amount || '',
      vat_claimable_status: payload.vat_claimable_status || 'pending',
      cit_deductible_status: payload.cit_deductible_status || 'pending',
      tax_risk_level: payload.tax_risk_level || 'low',
      tax_risk_reason: payload.tax_risk_reason || '',
      reviewed_by: payload.reviewed_by || '',
      reviewed_at: payload.reviewed_at || ''
    };
    if (existing) {
      return DataService.updateRowByKey('TAX_FLAGS', 'transaction_id', transactionId, row).after;
    }
    DataService.appendRow('TAX_FLAGS', row);
    return row;
  }

  function getTaxRiskSummary(filters) {
    var flags = DataService.filterRows('TAX_FLAGS', filters || {});
    var summary = { low: 0, medium: 0, high: 0, needs_expert: 0, pending_invoice: 0 };
    flags.forEach(function (row) {
      if (summary[row.tax_risk_level] !== undefined) summary[row.tax_risk_level] += 1;
      if (row.invoice_status === 'pending') summary.pending_invoice += 1;
    });
    return { summary: summary, items: flags };
  }

  function detectBasicTaxRisk(transaction) {
    if (!transaction) return {};
    if (transaction.direction === 'transfer') {
      return {
        invoice_status: 'not_applicable',
        payment_method: transaction.payment_method || '',
        non_cash_required: false,
        payment_proof_status: 'not_applicable',
        vat_claimable_status: 'not_applicable',
        cit_deductible_status: 'not_applicable',
        tax_risk_level: 'low',
        tax_risk_reason: 'Luân chuyển nội bộ, không đánh giá thuế.'
      };
    }
    if (transaction.direction === 'outflow' && Number(transaction.amount || 0) >= 20000000) {
      return {
        invoice_status: transaction.evidence_status === 'chua_co' ? 'pending' : 'provided',
        non_cash_required: true,
        payment_proof_status: transaction.payment_method === 'cash' ? 'needs_review' : 'pending',
        tax_risk_level: transaction.payment_method === 'cash' ? 'high' : 'medium',
        tax_risk_reason: 'Chi lớn cần kiểm tra hóa đơn và chứng từ thanh toán không tiền mặt.'
      };
    }
    if (transaction.direction === 'outflow' && ['chua_co', 'can_bo_sung', 'khong_hop_le'].indexOf(transaction.evidence_status) !== -1) {
      return {
        invoice_status: 'pending',
        payment_proof_status: 'pending',
        tax_risk_level: 'medium',
        tax_risk_reason: 'Khoản chi chưa đủ chứng từ.'
      };
    }
    return {
      invoice_status: transaction.direction === 'outflow' ? 'pending' : 'not_required',
      payment_proof_status: 'pending',
      tax_risk_level: 'low',
      tax_risk_reason: 'Chưa phát hiện rủi ro cơ bản.'
    };
  }

  return {
    createOrUpdateTaxFlags: createOrUpdateTaxFlags,
    getTaxRiskSummary: getTaxRiskSummary,
    detectBasicTaxRisk: detectBasicTaxRisk
  };
})();
