function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return handleJsonpApi_(e);
  }
  SchemaService.ensureRequiredSheets();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Kiro Finance Control')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleJsonpApi_(e) {
  var callback = e.parameter.callback || 'callback';
  var response;
  try {
    if (e.parameter.token !== APP_CONFIG.PUBLIC_API_TOKEN) {
      throw new Error('Invalid API token.');
    }
    var payload = {};
    if (e.parameter.payload) {
      payload = JSON.parse(e.parameter.payload);
    }
    if (e.parameter.action === 'login') {
      response = { ok: true, data: AuthService.login(payload.login_id, payload.password) };
      var loginBody = callback + '(' + JSON.stringify(response) + ');';
      return ContentService.createTextOutput(loginBody).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    if (payload.auth_token) {
      AuthService.setRequestUserFromToken(payload.auth_token);
    }
    var result;
    switch (e.parameter.action) {
      case 'bootstrap':
        result = apiGetBootstrapData();
        break;
      case 'dashboard':
        result = apiGetDashboard(payload);
        break;
      case 'transactions':
        result = apiGetTransactions(payload);
        break;
      case 'createTransaction':
        result = apiCreateTransaction(payload);
        break;
      case 'updateTransaction':
        result = apiUpdateTransaction(payload.transactionId, payload.updates || {});
        break;
      case 'staging':
        result = apiGetStagingItems(payload);
        break;
      case 'createStaging':
        result = apiCreateStagingFromRawText(payload.rawText, payload.sourceSystem || 'bank_sms');
        break;
      case 'confirmStaging':
        result = apiConfirmStaging(payload.importId, payload.confirmationPayload || {});
        break;
      case 'ignoreStaging':
        result = apiIgnoreStaging(payload.importId);
        break;
      case 'markDuplicate':
        result = apiMarkDuplicate(payload.importId);
        break;
      case 'tax':
        result = apiGetTaxSummary(payload);
        break;
      case 'financeReport':
        result = apiGetFinanceFullReport(payload);
        break;
      case 'dataQuality':
        result = apiGetDataQualityReport();
        break;
      case 'currentUser':
        result = AuthService.publicUser(PermissionService.getCurrentUser());
        break;
      case 'normalizeLegacy':
        result = apiNormalizeLegacyTransactions();
        break;
      default:
        throw new Error('Unknown action: ' + e.parameter.action);
    }
    response = { ok: true, data: result };
  } catch (err) {
    response = { ok: false, error: err.message || String(err) };
  }
  var body = callback + '(' + JSON.stringify(response) + ');';
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupFinanceCore() {
  return SchemaService.ensureRequiredSheets();
}

function apiGetBootstrapData() {
  var user = PermissionService.getCurrentUser();
  var key = cacheKey_('bootstrap', { user: user.user_id || user.email || '' });
  return cacheReadWrite_(key, 21600, function () {
    return MasterDataService.getBootstrapData();
  });
}

function apiGetDashboard(filters) {
  filters = filters || {};
  var user = PermissionService.getCurrentUser();
  var key = cacheKey_('dashboard', { user: user.user_id || user.email || '', filters: filters });
  return cacheReadWrite_(key, 21600, function () {
    return ReportService.getExecutiveSummary(filters);
  });
}

function apiCreateTransaction(payload) {
  var result = TransactionService.createTransaction(payload);
  bumpCacheVersion_();
  return result;
}

function apiGetTransactions(filters) {
  return TransactionService.getTransactions(filters || {});
}

function apiUpdateTransaction(transactionId, updates) {
  var result = TransactionService.updateTransaction(transactionId, updates || {});
  bumpCacheVersion_();
  return result;
}

function apiCancelTransaction(transactionId, reason) {
  var result = TransactionService.cancelTransaction(transactionId, reason || '');
  bumpCacheVersion_();
  return result;
}

function apiCreateStagingFromRawText(rawText, sourceSystem) {
  var result = ImportStagingService.createStagingFromRawText(rawText, sourceSystem || 'bank_sms');
  bumpCacheVersion_();
  return result;
}

function apiGetStagingItems(filters) {
  return ImportStagingService.getStagingItems(filters || {});
}

function apiConfirmStaging(importId, confirmationPayload) {
  var result = ImportStagingService.confirmStaging(importId, confirmationPayload || {});
  bumpCacheVersion_();
  return result;
}

function apiIgnoreStaging(importId) {
  return ImportStagingService.ignoreStaging(importId);
}

function apiMarkDuplicate(importId) {
  return ImportStagingService.markDuplicate(importId);
}

function apiGetTaxSummary(filters) {
  return TaxService.getTaxRiskSummary(filters || {});
}

function apiGetDataQualityReport() {
  return ReportService.getDataQualityReport();
}

function apiGetFinanceFullReport(filters) {
  filters = filters || {};
  var user = PermissionService.getCurrentUser();
  var key = cacheKey_('financeReport', { user: user.user_id || user.email || '', filters: filters });
  return cacheReadWrite_(key, 3600, function () {
    return ReportService.getFinanceFullReport(filters);
  });
}

function apiCreateCashPlan(payload) {
  return ForecastService.createCashPlan(payload || {});
}

function apiAddEvidence(payload) {
  return EvidenceService.addEvidence(payload || {});
}

function apiExportTransactionsCsv(filters) {
  return ReportService.exportTransactionsCsv(filters || {});
}

function apiExportCashSummaryCsv(filters) {
  return ReportService.exportCashSummaryCsv(filters || {});
}

function apiExportDataQualityCsv() {
  return ReportService.exportDataQualityCsv();
}

function apiNormalizeLegacyTransactions() {
  var result = NormalizationService.normalizeLegacyTransactions();
  bumpCacheVersion_();
  return result;
}

function cacheReadWrite_(key, ttlSeconds, producer) {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  var value = producer();
  try {
    cache.put(key, JSON.stringify(value), ttlSeconds);
  } catch (err) {
    // Large reports may exceed Apps Script cache value limits; returning fresh data is safer.
  }
  return value;
}

function cacheKey_(name, payload) {
  var version = PropertiesService.getScriptProperties().getProperty('CACHE_VERSION') || '1';
  var raw = JSON.stringify(payload || {});
  return 'kfc:' + name + ':' + version + ':' + DataService.generateHash([raw]).slice(0, 24);
}

function bumpCacheVersion_() {
  PropertiesService.getScriptProperties().setProperty('CACHE_VERSION', String(Date.now()));
}
