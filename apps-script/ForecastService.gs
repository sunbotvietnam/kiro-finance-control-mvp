var ForecastService = (function () {
  function getFourWeekForecast() {
    var start = new Date();
    var plans = getCashPlans({ status: 'planned' }).concat(getCashPlans({ status: 'committed' }));
    var available = TransactionService.calculateCashSummary({}).available;
    var weeks = [];
    for (var i = 0; i < 4; i++) {
      var from = new Date(start.getTime() + i * 7 * 24 * 3600 * 1000);
      var to = new Date(start.getTime() + (i + 1) * 7 * 24 * 3600 * 1000);
      var inflow = 0;
      var outflow = 0;
      plans.forEach(function (plan) {
        var d = new Date(plan.expected_date);
        if (d >= from && d < to) {
          if (plan.direction === 'inflow') inflow += Number(plan.amount || 0);
          if (plan.direction === 'outflow') outflow += Number(plan.amount || 0);
        }
      });
      available += inflow - outflow;
      weeks.push({
        week: i + 1,
        from: Utilities.formatDate(from, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd'),
        to: Utilities.formatDate(to, APP_CONFIG.TIMEZONE, 'yyyy-MM-dd'),
        planned_inflow: inflow,
        planned_outflow: outflow,
        projected_balance: available,
        warning: available < APP_CONFIG.CASH_WARNING_THRESHOLD ? 'low_cash' : ''
      });
    }
    return weeks;
  }

  function getForecast(days) {
    days = Number(days || 90);
    var available = TransactionService.calculateCashSummary({}).available;
    var plans = getCashPlans({ status: 'planned' }).concat(getCashPlans({ status: 'committed' }));
    var today = new Date();
    var horizon = new Date(today.getTime() + days * 24 * 3600 * 1000);
    var buckets = { next_30: { inflow: 0, outflow: 0 }, next_60: { inflow: 0, outflow: 0 }, next_90: { inflow: 0, outflow: 0 } };
    plans.forEach(function (plan) {
      var d = new Date(plan.expected_date);
      if (isNaN(d.getTime()) || d < today || d > horizon) return;
      var diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
      var key = diff <= 30 ? 'next_30' : (diff <= 60 ? 'next_60' : 'next_90');
      if (plan.direction === 'inflow') buckets[key].inflow += Number(plan.amount || 0);
      if (plan.direction === 'outflow') buckets[key].outflow += Number(plan.amount || 0);
    });
    var projected = available;
    Object.keys(buckets).forEach(function (key) {
      projected += buckets[key].inflow - buckets[key].outflow;
      buckets[key].net = buckets[key].inflow - buckets[key].outflow;
      buckets[key].projected_balance = projected;
      buckets[key].warning = projected < APP_CONFIG.CASH_WARNING_THRESHOLD ? 'low_cash' : '';
    });
    return {
      available: available,
      threshold: APP_CONFIG.CASH_WARNING_THRESHOLD,
      buckets: buckets,
      four_weeks: getFourWeekForecast(),
      plans: plans.sort(function (a, b) { return String(a.expected_date).localeCompare(String(b.expected_date)); }).slice(0, 100)
    };
  }

  function getCashPlans(filters) {
    return DataService.filterRows('CASH_PLANS', filters || {});
  }

  function createCashPlan(payload) {
    PermissionService.assertPermission('cash.create_transaction');
    payload = payload || {};
    if (!payload.expected_date || !payload.direction || !payload.amount) throw new Error('Thiếu ngày, chiều hoặc số tiền kế hoạch.');
    var planId = payload.plan_id || SequenceService.getNextSequence('cash_plan', 'PLAN');
    var row = {
      plan_id: planId,
      expected_date: payload.expected_date,
      period_month: DataService.periodMonth(payload.expected_date),
      tenant_id: payload.tenant_id || APP_CONFIG.DEFAULT_TENANT_ID,
      region_id: payload.region_id || '',
      territory_id: payload.territory_id || '',
      direction: payload.direction,
      amount: Number(payload.amount),
      category_code: payload.category_code || '',
      counterparty_id: payload.counterparty_id || '',
      school_id: payload.school_id || '',
      site_id: payload.site_id || '',
      staff_id: payload.staff_id || '',
      approval_request_id: payload.approval_request_id || '',
      payment_order_id: payload.payment_order_id || '',
      source_system: payload.source_system || 'manual',
      source_id: payload.source_id || planId,
      confidence_level: payload.confidence_level || 'possible',
      scenario: payload.scenario || 'base',
      status: payload.status || 'planned',
      owner_user_id: payload.owner_user_id || PermissionService.getCurrentUser().user_id,
      note: payload.note || '',
      created_at: DataService.nowIso(),
      updated_at: ''
    };
    DataService.appendRow('CASH_PLANS', row);
    AuditService.logAction('create_cash_plan', 'CASH_PLANS', planId, null, row, 'success', '');
    return row;
  }

  function convertPlanToActual(planId, transactionId) {
    var result = DataService.updateRowByKey('CASH_PLANS', 'plan_id', planId, {
      status: 'converted_to_actual',
      source_id: transactionId,
      updated_at: DataService.nowIso()
    });
    AuditService.logAction('convert_plan_to_actual', 'CASH_PLANS', planId, result.before, result.after, 'success', transactionId);
    return result.after;
  }

  return {
    getFourWeekForecast: getFourWeekForecast,
    getForecast: getForecast,
    getCashPlans: getCashPlans,
    createCashPlan: createCashPlan,
    convertPlanToActual: convertPlanToActual
  };
})();
