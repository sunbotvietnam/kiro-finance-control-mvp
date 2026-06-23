var SequenceService = (function () {
  function getNextSequence(sequenceKey, prefix) {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var period = DataService.periodMonth(new Date());
      var rows = DataService.readRows('SEQUENCE_REGISTRY');
      var existing = rows.find(function (row) {
        return row.sequence_key === sequenceKey && row.period === period;
      });
      if (!existing) {
        DataService.appendRow('SEQUENCE_REGISTRY', {
          sequence_key: sequenceKey,
          prefix: prefix,
          period: period,
          last_number: 1,
          padding: 6,
          reset_rule: 'monthly',
          updated_at: DataService.nowIso()
        });
        return buildDocumentNumber(prefix, period, 1, 6);
      }
      var next = Number(existing.last_number || 0) + 1;
      DataService.updateRowByNumber('SEQUENCE_REGISTRY', existing._rowNumber, {
        prefix: prefix,
        period: period,
        last_number: next,
        padding: existing.padding || 6,
        reset_rule: existing.reset_rule || 'monthly',
        updated_at: DataService.nowIso()
      });
      return buildDocumentNumber(prefix, period, next, Number(existing.padding || 6));
    } finally {
      lock.releaseLock();
    }
  }

  function buildDocumentNumber(prefix, period, number, padding) {
    padding = padding || 6;
    var n = String(number);
    while (n.length < padding) n = '0' + n;
    return prefix + '-' + period + '-' + n;
  }

  return {
    getNextSequence: getNextSequence,
    buildDocumentNumber: buildDocumentNumber
  };
})();
