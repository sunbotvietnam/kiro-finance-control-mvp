function doGet() {
  SchemaService.ensureRequiredSheets();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Kiro Finance Control')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
