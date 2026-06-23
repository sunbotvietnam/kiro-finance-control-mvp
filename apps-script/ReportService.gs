var ReportService = (function () {
  function getExecutiveSummary(filters) {
    var allRows = TransactionService.getTransactions({});
    filters = currentMonthFilterFromRows(filters, allRows);
    var periodRows = filterRowsByPeriod(allRows, filters.period_month);
    var summary = calculateSummaryFromRows(periodRows, allRows);
    return {
      title: 'Báo cáo điều hành rút gọn',
      period_month: filters.period_month || '',
      period_label: DataService.displayPeriodMonth(filters.period_month || ''),
      cash: summary,
      balances: calculateBalancesFromRows(allRows),
      top_expense_groups: groupCash(periodRows.filter(function (tx) { return tx.direction === 'outflow'; }), 'category_code').slice(0, 5)
    };
  }

  function getFinanceFullReport(filters) {
    filters = filters || {};
    return {
      title: 'Báo cáo tài chính đầy đủ cơ bản',
      cash_by_category: getCashByCategory(filters),
      cash_by_account: getCashByAccount(filters),
      cash_by_school: getCashBySchool(filters),
      cash_by_counterparty: getCashByCounterparty(filters),
      cash_by_staff: getCashByStaff(filters),
      cash_by_month: getCashByMonth(filters),
      evidence_status: groupSum(TransactionService.getTransactions(filters), 'evidence_status'),
      tax_risk: TaxService.getTaxRiskSummary(filters),
      data_quality: getDataQualityReport()
    };
  }

  function getCashByCategory(filters) {
    return groupCash(TransactionService.getTransactions(filters || {}), 'category_code');
  }

  function getCashByAccount(filters) {
    return groupCash(TransactionService.getTransactions(filters || {}), 'account_id');
  }

  function getCashByCounterparty(filters) {
    return groupCash(TransactionService.getTransactions(filters || {}), 'counterparty_id');
  }

  function getCashBySchool(filters) {
    return groupCash(TransactionService.getTransactions(filters || {}), 'school_id');
  }

  function getCashByStaff(filters) {
    return groupCash(TransactionService.getTransactions(filters || {}), 'staff_id');
  }

  function getDataQualityReport() {
    var txs = TransactionService.getTransactions({});
    var categories = indexBy(MasterDataService.getCategories(), 'category_code');
    var accounts = indexBy(MasterDataService.getAccounts(), 'account_id');
    var issues = [];
    txs.forEach(function (tx) {
      if (['cancelled', 'voided', 'archived'].indexOf(tx.status) !== -1) return;
      addIssue(issues, tx, 'missing_category', !tx.category_code, 'Giao dịch thiếu mã khoản.');
      addIssue(issues, tx, 'unknown_category', tx.category_code && !categories[tx.category_code], 'Mã khoản chưa có trong DM_CATEGORY.');
      addIssue(issues, tx, 'missing_counterparty', !tx.counterparty_id, 'Giao dịch thiếu đối tượng.');
      addIssue(issues, tx, 'missing_account', !tx.account_id, 'Giao dịch thiếu tài khoản tiền.');
      addIssue(issues, tx, 'unknown_account', tx.account_id && !accounts[tx.account_id], 'Tài khoản tiền chưa có trong DM_ACCOUNT.');
      addIssue(issues, tx, 'invalid_period_month', !DataService.normalizePeriodMonth(tx.period_month || tx.transaction_date), 'Kỳ báo cáo không đọc được.');
      addIssue(issues, tx, 'missing_evidence', ['chua_co', 'can_bo_sung', 'khong_hop_le'].indexOf(tx.evidence_status) !== -1, 'Giao dịch thiếu/cần bổ sung chứng từ.');
      addIssue(issues, tx, 'unmatched', tx.match_status === 'unmatched', 'Giao dịch chưa match.');
      addIssue(issues, tx, 'tax_review_needed', ['pending', 'needs_expert'].indexOf(tx.tax_review_status) !== -1, 'Giao dịch cần rà soát thuế.');
      addIssue(issues, tx, 'source_missing_id', tx.source_system && !tx.source_id, 'Có source_system nhưng thiếu source_id.');
      addIssue(issues, tx, 'payment_order_source_mismatch', tx.payment_order_id && ['payment_order', 'bank_sms', 'bank_email', 'bank_statement', 'manual'].indexOf(tx.source_system) === -1, 'Có payment_order_id nhưng source_system không phù hợp.');
      addIssue(issues, tx, 'transfer_missing_account', tx.direction === 'transfer' && !tx.account_id, 'Luân chuyển nội bộ thiếu tài khoản nguồn/đích.');
    });
    return {
      total_issues: issues.length,
      issues: issues,
      by_type: groupCount(issues, 'issue_type')
    };
  }

  function exportTransactionsCsv(filters) {
    return DataService.toCsv(TransactionService.getTransactions(filters || {}), SHEET_HEADERS.TRANSACTIONS);
  }

  function exportCashSummaryCsv(filters) {
    var summary = TransactionService.calculateCashSummary(filters || {});
    return DataService.toCsv([summary], ['inflow', 'outflow', 'transfer', 'net', 'available', 'needs_review', 'missing_evidence', 'unmatched']);
  }

  function exportDataQualityCsv() {
    return DataService.toCsv(getDataQualityReport().issues, ['transaction_id', 'issue_type', 'message', 'severity']);
  }

  function groupCash(rows, key) {
    var groups = {};
    rows.forEach(function (tx) {
      if (['cancelled', 'voided', 'archived'].indexOf(tx.status) !== -1) return;
      var groupKey = key === 'period_month' ? DataService.normalizePeriodMonth(tx[key] || tx.transaction_date) : (tx[key] || '(trống)');
      if (!groups[groupKey]) groups[groupKey] = { key: groupKey, inflow: 0, outflow: 0, transfer: 0, net: 0, count: 0 };
      var amount = Number(tx.amount || 0);
      if (tx.direction === 'inflow') groups[groupKey].inflow += amount;
      if (tx.direction === 'outflow') groups[groupKey].outflow += amount;
      if (tx.direction === 'transfer') groups[groupKey].transfer += amount;
      groups[groupKey].net = groups[groupKey].inflow - groups[groupKey].outflow;
      groups[groupKey].count += 1;
    });
    return Object.keys(groups).map(function (key) { return groups[key]; }).sort(function (a, b) {
      return b.outflow - a.outflow;
    });
  }

  function getCashByMonth(filters) {
    return groupCash(TransactionService.getTransactions(filters || {}), 'period_month');
  }

  function groupSum(rows, key) {
    return groupCount(rows, key);
  }

  function groupCount(rows, key) {
    var result = {};
    rows.forEach(function (row) {
      var k = row[key] || '(trống)';
      result[k] = (result[k] || 0) + 1;
    });
    return result;
  }

  function addIssue(list, tx, issueType, condition, message) {
    if (!condition) return;
    list.push({
      transaction_id: tx.transaction_id,
      issue_type: issueType,
      message: message,
      severity: issueType === 'source_missing_id' ? 'high' : 'medium'
    });
  }

  function currentMonthFilter(filters) {
    filters = filters || {};
    if (filters.period_month) {
      filters.period_month = DataService.normalizePeriodMonth(filters.period_month);
      return filters;
    }
    filters.period_month = getLatestTransactionPeriod() || DataService.periodMonth(new Date());
    return filters;
  }

  function currentMonthFilterFromRows(filters, rows) {
    filters = filters || {};
    if (filters.period_month) {
      filters.period_month = DataService.normalizePeriodMonth(filters.period_month);
      return filters;
    }
    filters.period_month = getLatestTransactionPeriodFromRows(rows || []) || DataService.periodMonth(new Date());
    return filters;
  }

  function getLatestTransactionPeriod() {
    var latest = '';
    DataService.readRows('TRANSACTIONS').forEach(function (tx) {
      if (['cancelled', 'voided', 'archived'].indexOf(tx.status) !== -1) return;
      var period = DataService.normalizePeriodMonth(tx.period_month || tx.transaction_date);
      if (period && period > latest) latest = period;
    });
    return latest;
  }

  function getLatestTransactionPeriodFromRows(rows) {
    var latest = '';
    (rows || []).forEach(function (tx) {
      if (['cancelled', 'voided', 'archived'].indexOf(tx.status) !== -1) return;
      var period = DataService.normalizePeriodMonth(tx.period_month || tx.transaction_date);
      if (period && period > latest) latest = period;
    });
    return latest;
  }

  function filterRowsByPeriod(rows, periodMonth) {
    var period = DataService.normalizePeriodMonth(periodMonth);
    return (rows || []).filter(function (row) {
      return !period || DataService.normalizePeriodMonth(row.period_month || row.transaction_date) === period;
    });
  }

  function calculateSummaryFromRows(periodRows, allRows) {
    var summary = { inflow: 0, outflow: 0, transfer: 0, net: 0, available: 0, needs_review: 0, missing_evidence: 0, unmatched: 0 };
    (periodRows || []).forEach(function (tx) {
      if (['cancelled', 'voided', 'archived'].indexOf(tx.status) !== -1) return;
      var amount = Number(tx.amount || 0);
      if (tx.direction === 'inflow') summary.inflow += amount;
      if (tx.direction === 'outflow') summary.outflow += amount;
      if (tx.direction === 'transfer') summary.transfer += amount;
      if (tx.status === 'needs_review') summary.needs_review += 1;
      if (['chua_co', 'can_bo_sung', 'khong_hop_le'].indexOf(tx.evidence_status) !== -1) summary.missing_evidence += 1;
      if (tx.match_status === 'unmatched') summary.unmatched += 1;
    });
    summary.net = summary.inflow - summary.outflow;
    summary.available = calculateBalancesFromRows(allRows || []).reduce(function (sum, account) {
      return sum + Number(account.balance || 0);
    }, 0);
    return summary;
  }

  function calculateBalancesFromRows(rows) {
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
    (rows || []).forEach(function (tx) {
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

  function indexBy(rows, key) {
    var map = {};
    rows.forEach(function (row) {
      if (row[key]) map[row[key]] = row;
    });
    return map;
  }

  return {
    getExecutiveSummary: getExecutiveSummary,
    getFinanceFullReport: getFinanceFullReport,
    getCashByCategory: getCashByCategory,
    getCashByAccount: getCashByAccount,
    getCashByCounterparty: getCashByCounterparty,
    getCashByStaff: getCashByStaff,
    getDataQualityReport: getDataQualityReport,
    exportTransactionsCsv: exportTransactionsCsv,
    exportCashSummaryCsv: exportCashSummaryCsv,
    exportDataQualityCsv: exportDataQualityCsv
  };
})();
