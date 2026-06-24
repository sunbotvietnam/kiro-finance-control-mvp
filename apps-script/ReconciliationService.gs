var ReconciliationService = (function () {
  function getReport(filters) {
    filters = filters || {};
    var txs = TransactionService.getTransactions(filters);
    var evidenceRows = DataService.readRows('EVIDENCE');
    var plans = DataService.readRows('CASH_PLANS');
    var paymentOrders = DataService.readRows('PAYMENT_ORDERS');
    var unmatched = [];
    var suggested = [];
    txs.forEach(function (tx) {
      if (['cancelled', 'voided', 'archived'].indexOf(tx.status) !== -1) return;
      var evidence = evidenceRows.filter(function (e) { return String(e.transaction_id) === String(tx.transaction_id); });
      var plan = findPlanMatch(tx, plans);
      var order = findPaymentOrderMatch(tx, paymentOrders);
      var score = 0;
      var reasons = [];
      if (evidence.length) {
        score += 0.45;
        reasons.push('Có chứng từ link theo giao dịch');
      }
      if (plan) {
        score += 0.25;
        reasons.push('Khớp kế hoạch dòng tiền ' + plan.plan_id);
      }
      if (order) {
        score += 0.25;
        reasons.push('Khớp lệnh chi ' + order.payment_order_id);
      }
      if (tx.source_system && tx.source_id) {
        score += 0.15;
        reasons.push('Có nguồn nhập ' + tx.source_system);
      }
      if (score >= 0.5) {
        suggested.push({ transaction_id: tx.transaction_id, score: Math.min(score, 1), reasons: reasons.join('; ') });
      } else if (tx.match_status !== 'matched') {
        unmatched.push({ transaction_id: tx.transaction_id, amount: tx.amount, date: tx.transaction_date, category_code: tx.category_code, reason: 'Thiếu bằng chứng match đủ mạnh' });
      }
    });
    return {
      total_transactions: txs.length,
      unmatched_count: unmatched.length,
      suggested_count: suggested.length,
      suggestions: suggested.slice(0, 100),
      unmatched: unmatched.slice(0, 100)
    };
  }

  function autoReconcile(filters) {
    PermissionService.assertPermission('cash.review_transaction');
    var report = getReport(filters || {});
    var updated = 0;
    report.suggestions.forEach(function (item) {
      if (item.score < 0.5) return;
      TransactionService.updateTransaction(item.transaction_id, { match_status: 'matched', status: 'confirmed' });
      updated += 1;
    });
    AuditService.logAction('auto_reconcile', 'TRANSACTIONS', 'batch', null, { updated: updated }, 'success', '');
    return { updated: updated, report: getReport(filters || {}) };
  }

  function findPlanMatch(tx, plans) {
    return plans.find(function (plan) {
      if (['converted_to_actual', 'cancelled'].indexOf(plan.status) !== -1) return false;
      if (plan.direction !== tx.direction) return false;
      if (Number(plan.amount || 0) !== Number(tx.amount || 0)) return false;
      if (plan.category_code && tx.category_code && plan.category_code !== tx.category_code) return false;
      if (plan.school_id && tx.school_id && plan.school_id !== tx.school_id) return false;
      return daysBetween(plan.expected_date, tx.transaction_date) <= 7;
    });
  }

  function findPaymentOrderMatch(tx, orders) {
    return orders.find(function (order) {
      if (order.transaction_id && order.transaction_id === tx.transaction_id) return true;
      if (Number(order.amount_paid || order.amount_payable || 0) !== Number(tx.amount || 0)) return false;
      if (order.payment_account_id && tx.account_id && order.payment_account_id !== tx.account_id) return false;
      return !order.actual_payment_date || daysBetween(order.actual_payment_date, tx.transaction_date) <= 7;
    });
  }

  function daysBetween(a, b) {
    if (!a || !b) return 999;
    var da = new Date(a);
    var db = new Date(b);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return 999;
    return Math.abs(da.getTime() - db.getTime()) / 86400000;
  }

  return {
    getReport: getReport,
    autoReconcile: autoReconcile
  };
})();
