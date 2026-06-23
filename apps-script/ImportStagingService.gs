var ImportStagingService = (function () {
  function createStagingFromRawText(rawText, sourceSystem) {
    PermissionService.assertPermission('cash.create_transaction');
    if (!rawText) throw new Error('Thiếu nội dung SMS/email ngân hàng.');
    sourceSystem = sourceSystem || 'bank_sms';
    var parsed = parseBankMessage(rawText);
    var importId = SequenceService.getNextSequence('import_staging', 'IMP');
    var duplicateHash = DataService.generateHash([sourceSystem, rawText, parsed.amount, parsed.date, parsed.direction]);
    var status = findDuplicateInStagingOrTransactions(duplicateHash) ? 'duplicate' : (parsed.amount ? 'suggested' : 'needs_review');
    var alias = suggestCounterparty(parsed);
    var row = {
      import_id: importId,
      source_system: sourceSystem,
      raw_text: rawText,
      raw_file_link: '',
      detected_date: parsed.date || '',
      detected_amount: parsed.amount || '',
      detected_direction: parsed.direction || '',
      detected_account: parsed.account || '',
      detected_counterparty_text: parsed.counterpartyText || '',
      detected_description: parsed.description || rawText,
      suggested_category_code: suggestCategory(parsed),
      suggested_counterparty_id: alias ? alias.canonical_id : '',
      suggested_staff_id: parsed.staff_id || '',
      suggested_source_id: importId,
      confidence_score: parsed.confidence || 0.5,
      duplicate_hash: duplicateHash,
      review_status: status,
      reviewed_by: '',
      reviewed_at: '',
      created_at: DataService.nowIso()
    };
    DataService.appendRow('IMPORT_STAGING', row);
    AuditService.logAction('create_staging', 'IMPORT_STAGING', importId, null, row, 'success', '');
    return row;
  }

  function parseBankMessage(rawText) {
    var text = String(rawText || '');
    var lower = DataService.normalizeText(text);
    var amount = parseAmount(text);
    var direction = '';
    if (/(ghi co|credit|nhan|vao|cong|incoming|\+)/i.test(lower)) direction = 'inflow';
    if (/(ghi no|debit|chuyen di|thanh toan|tru|outgoing|-)/i.test(lower)) direction = direction || 'outflow';
    var dateMatch = text.match(/(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?/);
    var date = '';
    if (dateMatch) {
      var year = dateMatch[3] ? String(dateMatch[3]) : String(new Date().getFullYear());
      if (year.length === 2) year = '20' + year;
      date = year + '-' + pad2(dateMatch[2]) + '-' + pad2(dateMatch[1]);
    } else {
      date = Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyy-MM-dd');
    }
    var account = '';
    MasterDataService.getAccounts().forEach(function (acc) {
      if (!account && text.indexOf(acc.account_number_masked.replace(/\*/g, '')) !== -1) account = acc.account_id;
      if (!account && DataService.normalizeText(text).indexOf(DataService.normalizeText(acc.bank_name)) !== -1) account = acc.account_id;
    });
    return {
      date: date,
      amount: amount,
      direction: direction || 'inflow',
      account: account,
      counterpartyText: extractCounterpartyText(text),
      description: text.slice(0, 500),
      confidence: amount ? 0.75 : 0.35
    };
  }

  function suggestCategory(parsed) {
    if (!parsed || !parsed.direction) return 'CHIKHAC';
    var desc = DataService.normalizeText(parsed.description || '');
    if (parsed.direction === 'transfer') return 'LUANCHUYEN';
    if (parsed.direction === 'inflow') {
      if (desc.indexOf('cong no') !== -1 || desc.indexOf('thu no') !== -1) return 'THUNO';
      if (desc.indexOf('ung') !== -1) return 'UNGHD';
      return 'THUHD';
    }
    if (desc.indexOf('luong') !== -1 || desc.indexOf('bhxh') !== -1) return 'LUONG-BH';
    if (desc.indexOf('thue') !== -1) return 'THUE';
    if (desc.indexOf('mat bang') !== -1 || desc.indexOf('thue nha') !== -1) return 'THUEMATBANG';
    if (desc.indexOf('tam ung') !== -1) return 'TAMUNG';
    return 'CHIKHAC';
  }

  function suggestCounterparty(parsed) {
    if (!parsed) return null;
    return MasterDataService.resolveAlias(parsed.counterpartyText || parsed.description || '');
  }

  function confirmStaging(importId, confirmationPayload) {
    PermissionService.assertPermission('cash.create_transaction');
    var item = DataService.findByKey('IMPORT_STAGING', 'import_id', importId);
    if (!item) throw new Error('Không tìm thấy staging.');
    if (item.review_status === 'confirmed') throw new Error('Staging đã xác nhận.');
    if (item.review_status === 'duplicate') throw new Error('Staging đang đánh dấu trùng.');
    var payload = confirmationPayload || {};
    var tx = TransactionService.createTransaction({
      transaction_date: payload.transaction_date || item.detected_date,
      direction: payload.direction || item.detected_direction,
      amount: payload.amount || item.detected_amount,
      account_id: payload.account_id || item.detected_account,
      category_code: payload.category_code || item.suggested_category_code,
      counterparty_id: payload.counterparty_id || item.suggested_counterparty_id,
      counterparty_text: item.detected_counterparty_text,
      staff_id: payload.staff_id || item.suggested_staff_id,
      description: payload.description || item.detected_description,
      payment_method: payload.payment_method || '',
      evidence_status: payload.evidence_status || 'chua_co',
      source_system: item.source_system,
      source_id: item.import_id,
      duplicate_hash: item.duplicate_hash
    });
    var result = DataService.updateRowByKey('IMPORT_STAGING', 'import_id', importId, {
      review_status: 'confirmed',
      reviewed_by: PermissionService.getCurrentUser().email,
      reviewed_at: DataService.nowIso()
    });
    AuditService.logAction('confirm_staging', 'IMPORT_STAGING', importId, result.before, result.after, 'success', tx.transaction_id);
    return { staging: result.after, transaction: tx };
  }

  function ignoreStaging(importId) {
    return setReviewStatus(importId, 'ignored');
  }

  function markDuplicate(importId) {
    return setReviewStatus(importId, 'duplicate');
  }

  function getStagingItems(filters) {
    return DataService.filterRows('IMPORT_STAGING', filters || {}).sort(function (a, b) {
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  }

  function setReviewStatus(importId, status) {
    PermissionService.assertPermission('cash.review_transaction');
    var result = DataService.updateRowByKey('IMPORT_STAGING', 'import_id', importId, {
      review_status: status,
      reviewed_by: PermissionService.getCurrentUser().email,
      reviewed_at: DataService.nowIso()
    });
    AuditService.logAction('update_staging_status', 'IMPORT_STAGING', importId, result.before, result.after, 'success', status);
    return result.after;
  }

  function findDuplicateInStagingOrTransactions(hash) {
    if (!hash) return false;
    return DataService.readRows('TRANSACTIONS').some(function (row) { return row.duplicate_hash === hash; }) ||
      DataService.readRows('IMPORT_STAGING').some(function (row) { return row.duplicate_hash === hash; });
  }

  function parseAmount(text) {
    var matches = String(text || '').match(/(?:\+|-)?\s?(\d{1,3}(?:[.,]\d{3})+|\d+)(?:\s?VND|\s?VNĐ|\s?₫|\s?d)?/gi);
    if (!matches || !matches.length) return 0;
    var best = matches.map(function (m) {
      return Number(String(m).replace(/[^\d]/g, ''));
    }).sort(function (a, b) { return b - a; })[0];
    return best || 0;
  }

  function extractCounterpartyText(text) {
    var m = String(text || '').match(/(?:tu|from|den|to|noi dung|nd)[:\s-]+(.{3,80})/i);
    return m ? m[1].trim() : '';
  }

  function pad2(value) {
    value = String(value);
    return value.length === 1 ? '0' + value : value;
  }

  return {
    createStagingFromRawText: createStagingFromRawText,
    parseBankMessage: parseBankMessage,
    suggestCategory: suggestCategory,
    suggestCounterparty: suggestCounterparty,
    confirmStaging: confirmStaging,
    ignoreStaging: ignoreStaging,
    markDuplicate: markDuplicate,
    getStagingItems: getStagingItems
  };
})();
