var ImportStagingService = (function () {
  function createStagingFromRawText(rawText, sourceSystem) {
    PermissionService.assertPermission('cash.create_transaction');
    if (!rawText) throw new Error('Thiếu nội dung SMS/email ngân hàng.');
    sourceSystem = sourceSystem || 'bank_sms';
    var parsed = parseSmartFinanceText(rawText);
    var importId = nextUniqueImportId();
    var duplicateHash = DataService.generateHash([sourceSystem, rawText, parsed.amount, parsed.date, parsed.direction]);
    var duplicateSuspected = findDuplicateInStagingOrTransactions(duplicateHash);
    var status = parsed.amount ? 'suggested' : 'needs_review';
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
      confidence_score: duplicateSuspected ? Math.min(Number(parsed.confidence || 0.5), 0.45) : (parsed.confidence || 0.5),
      duplicate_hash: duplicateHash,
      review_status: status,
      reviewed_by: '',
      reviewed_at: '',
      created_at: DataService.nowIso(),
      suggested_school_id: parsed.school_id || ''
    };
    DataService.appendRow('IMPORT_STAGING', row);
    AuditService.logAction('create_staging', 'IMPORT_STAGING', importId, null, row, 'success', '');
    return row;
  }

  function createStagingBatch(rawText, sourceSystem) {
    PermissionService.assertPermission('cash.create_transaction');
    if (!rawText) throw new Error('Thiếu nội dung đầu vào.');
    var chunks = splitRawInput(rawText);
    var rows = chunks.map(function (chunk) {
      return createStagingFromRawText(chunk, sourceSystem || 'bank_sms');
    });
    return { count: rows.length, items: rows };
  }

  function parseBankMessage(rawText) {
    var text = String(rawText || '');
    var lower = DataService.normalizeText(text);
    var amount = parseAmount(text);
    var direction = '';
    if (/(ghi co|credit|nhan|vao|cong|incoming|\+)/i.test(lower)) direction = 'inflow';
    if (/(^|\s)\+\s?\d/.test(text) || /(ghi co|credit|nhan tien|chuyen den|incoming)/i.test(lower)) direction = 'inflow';
    if (/(^|\s)-\s?\d/.test(text) || /(ghi no|debit|chuyen di|thanh toan|tru tien|bi tru|outgoing)/i.test(lower)) direction = 'outflow';
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
      school_id: detectSchoolId(text),
      staff_id: detectStaffId(text),
      confidence: amount ? 0.75 : 0.35
    };
  }

  function parseSmartFinanceText(rawText) {
    var fallback = parseBankMessage(rawText);
    var ai = AiParseService.parseFinanceText(rawText, {
      categories: MasterDataService.getCategories().map(function (row) { return row.category_code + ':' + row.category_name; })
    });
    var directionOverride = detectDirectionOverride(rawText);
    if (!ai) {
      fallback.direction = directionOverride || fallback.direction;
      return fallback;
    }
    return {
      date: ai.transaction_date || fallback.date,
      amount: Number(ai.amount || fallback.amount || 0),
      direction: directionOverride || ai.direction || fallback.direction,
      account: ai.account_hint || fallback.account,
      counterpartyText: ai.counterparty_text || fallback.counterpartyText,
      description: ai.description || fallback.description,
      category_code: ai.category_code || '',
      school_id: ai.school_id || fallback.school_id || '',
      staff_id: ai.staff_id || fallback.staff_id || '',
      confidence: Number(ai.confidence || fallback.confidence || 0.5)
    };
  }

  function suggestCategory(parsed) {
    if (!parsed || !parsed.direction) return 'CHIKHAC';
    var desc = DataService.normalizeText(parsed.description || '');
    if (parsed.direction === 'transfer') return 'LUANCHUYEN';
    if (parsed.direction === 'inflow') {
      if (desc.indexOf('cong no') !== -1 || desc.indexOf('thu no') !== -1) return 'THUNO';
      if (/(^|\s)ung(\s|$)|ung hop dong|tam ung/i.test(desc)) return 'UNGHD';
      return 'THUHD';
    }
    if (desc.indexOf('in an') !== -1 || desc.indexOf('in ') !== -1 || desc.indexOf('an pham') !== -1 ||
        desc.indexOf('media') !== -1 || desc.indexOf('quang lich') !== -1 || desc.indexOf('chung nhan') !== -1) return 'MEDIA';
    if (parsed.category_code) return parsed.category_code;
    if (desc.indexOf('luong') !== -1 || desc.indexOf('bhxh') !== -1) return 'LUONG-BH';
    if (desc.indexOf('thue') !== -1) return 'THUE';
    if (desc.indexOf('mat bang') !== -1 || desc.indexOf('thue nha') !== -1) return 'THUEMATBANG';
    if (/(^|\s)tam ung(\s|$)|(^|\s)ung(\s|$)/i.test(desc)) return 'TAMUNG';
    return 'CHIKHAC';
  }

  function nextUniqueImportId() {
    var importId = 'IMP-' + Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random() * 1000);
    var guard = 0;
    while (DataService.findByKey('IMPORT_STAGING', 'import_id', importId) && guard < 20) {
      importId = 'IMP-' + Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random() * 1000);
      guard += 1;
    }
    return importId;
  }

  function splitRawInput(rawText) {
    var text = String(rawText || '').trim();
    var lines = text.split(/\n+/).map(function (line) { return line.trim(); }).filter(function (line) { return line.length >= 8; });
    if (lines.length <= 1) return [text];
    var statementLike = lines.filter(function (line) { return /\d/.test(line) && /(\d{1,3}([.,]\d{3})+|\d{5,})/.test(line); });
    return statementLike.length >= 2 ? statementLike : [text];
  }

  function detectDirectionOverride(text) {
    var raw = String(text || '');
    var normalized = DataService.normalizeText(raw);
    if (/(ghi no|debit|tru tien|bi tru|chuyen di|thanh toan|outgoing)/i.test(normalized)) return 'outflow';
    if (/(^|\s)-\s?\d/.test(raw)) return 'outflow';
    if (/(ghi co|credit|nhan tien|cong tien|chuyen den|incoming)/i.test(normalized)) return 'inflow';
    if (/(^|\s)\+\s?\d/.test(raw)) return 'inflow';
    return '';
  }

  function detectSchoolId(text) {
    var normalized = DataService.normalizeText(text);
    var hit = MasterDataService.getSchools().find(function (school) {
      return school.school_id && normalized.indexOf(DataService.normalizeText(school.school_id)) !== -1;
    });
    if (hit) return hit.school_id;
    hit = MasterDataService.getSchools().find(function (school) {
      return school.short_name && normalized.indexOf(DataService.normalizeText(school.short_name)) !== -1;
    });
    return hit ? hit.school_id : '';
  }

  function detectStaffId(text) {
    var normalized = DataService.normalizeText(text);
    var hit = MasterDataService.getStaff().find(function (staff) {
      return staff.staff_name && normalized.indexOf(DataService.normalizeText(staff.staff_name)) !== -1;
    });
    return hit ? hit.staff_id : '';
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
      school_id: payload.school_id || '',
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
    repairDuplicateImportIds();
    return DataService.filterRows('IMPORT_STAGING', filters || {}).sort(function (a, b) {
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  }

  function repairDuplicateImportIds() {
    var seen = {};
    DataService.readRows('IMPORT_STAGING').forEach(function (row) {
      if (!row.import_id || seen[row.import_id]) {
        DataService.updateRowByNumber('IMPORT_STAGING', row._rowNumber, { import_id: nextUniqueImportId() });
      } else {
        seen[row.import_id] = true;
      }
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
    var raw = String(text || '');
    var signed = raw.match(/(?:^|\s)(?:\+|-)\s?(\d{1,3}(?:[.,]\d{3})+|\d+)(?:\s?VND|\s?VNĐ|\s?₫|\s?d)?/i);
    if (signed) return Number(String(signed[1]).replace(/[^\d]/g, '')) || 0;
    var currency = raw.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s?(?:VND|VNĐ|₫|d)(?![a-z])/i);
    if (currency) return Number(String(currency[1]).replace(/[^\d]/g, '')) || 0;
    var matches = raw.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)/gi);
    if (!matches || !matches.length) return 0;
    var best = matches.map(function (m) {
      return Number(String(m).replace(/[^\d]/g, ''));
    }).filter(function (n) { return n > 0 && n < 10000000000; }).sort(function (a, b) { return b - a; })[0];
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
    createStagingBatch: createStagingBatch,
    parseBankMessage: parseBankMessage,
    suggestCategory: suggestCategory,
    suggestCounterparty: suggestCounterparty,
    confirmStaging: confirmStaging,
    ignoreStaging: ignoreStaging,
    markDuplicate: markDuplicate,
    getStagingItems: getStagingItems
  };
})();
