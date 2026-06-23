function doGet(e) {
  SchemaService.ensureRequiredSheets();
  if (e && e.parameter && e.parameter.action) {
    return handleJsonpApi_(e);
  }
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
  SchemaService.ensureRequiredSheets();
  return MasterDataService.getBootstrapData();
}

function apiGetDashboard(filters) {
  return ReportService.getExecutiveSummary(filters || {});
}

function apiCreateTransaction(payload) {
  return TransactionService.createTransaction(payload);
}

function apiGetTransactions(filters) {
  return TransactionService.getTransactions(filters || {});
}

function apiUpdateTransaction(transactionId, updates) {
  return TransactionService.updateTransaction(transactionId, updates || {});
}

function apiCancelTransaction(transactionId, reason) {
  return TransactionService.cancelTransaction(transactionId, reason || '');
}

function apiCreateStagingFromRawText(rawText, sourceSystem) {
  return ImportStagingService.createStagingFromRawText(rawText, sourceSystem || 'bank_sms');
}

function apiGetStagingItems(filters) {
  return ImportStagingService.getStagingItems(filters || {});
}

function apiConfirmStaging(importId, confirmationPayload) {
  return ImportStagingService.confirmStaging(importId, confirmationPayload || {});
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
  return ReportService.getFinanceFullReport(filters || {});
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
