var PaymentOrderHookService = (function () {
  function getPaymentOrderById(paymentOrderId) {
    return DataService.findByKey('PAYMENT_ORDERS', 'payment_order_id', paymentOrderId);
  }

  function linkTransactionToPaymentOrder(transactionId, paymentOrderId) {
    var paymentOrder = getPaymentOrderById(paymentOrderId);
    if (!paymentOrder) throw new Error('Không tìm thấy lệnh thanh toán.');
    var tx = TransactionService.updateTransaction(transactionId, { payment_order_id: paymentOrderId });
    AuditService.logAction('link_payment_order', 'TRANSACTIONS', transactionId, null, { payment_order_id: paymentOrderId }, 'success', '');
    return tx;
  }

  return {
    getPaymentOrderById: getPaymentOrderById,
    linkTransactionToPaymentOrder: linkTransactionToPaymentOrder
  };
})();
