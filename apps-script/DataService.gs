var DataService = (function () {
  function getSpreadsheet() {
    var id = PropertiesService.getScriptProperties().getProperty('FINANCE_SHEET_ID');
    if (id) return SpreadsheetApp.openById(id);
    if (APP_CONFIG.DEFAULT_SHEET_ID) return SpreadsheetApp.openById(APP_CONFIG.DEFAULT_SHEET_ID);
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (!active) {
      throw new Error('Chưa cấu hình FINANCE_SHEET_ID trong Script Properties.');
    }
    return active;
  }

  function getSheet(sheetName) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    return sheet;
  }

  function getHeaders(sheetName) {
    var sheet = getSheet(sheetName);
    var lastColumn = Math.max(sheet.getLastColumn(), 1);
    return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String);
  }

  function readRows(sheetName) {
    var sheet = getSheet(sheetName);
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    var headers = values[0];
    return values.slice(1).filter(function (row) {
      return row.some(function (cell) { return cell !== ''; });
    }).map(function (row, idx) {
      var obj = { _rowNumber: idx + 2 };
      headers.forEach(function (header, i) { obj[header] = row[i]; });
      return obj;
    });
  }

  function appendRow(sheetName, objectValue) {
    var sheet = getSheet(sheetName);
    var headers = getHeaders(sheetName);
    var row = headers.map(function (header) {
      return objectValue[header] === undefined ? '' : objectValue[header];
    });
    sheet.appendRow(row);
    return objectValue;
  }

  function updateRowByKey(sheetName, keyField, keyValue, updates) {
    var sheet = getSheet(sheetName);
    var headers = getHeaders(sheetName);
    var rows = readRows(sheetName);
    var found = rows.find(function (row) { return String(row[keyField]) === String(keyValue); });
    if (!found) throw new Error('Không tìm thấy bản ghi: ' + keyValue);
    var before = {};
    headers.forEach(function (header) { before[header] = found[header]; });
    Object.keys(updates || {}).forEach(function (key) { found[key] = updates[key]; });
    var values = headers.map(function (header) { return found[header] === undefined ? '' : found[header]; });
    sheet.getRange(found._rowNumber, 1, 1, headers.length).setValues([values]);
    delete found._rowNumber;
    return { before: before, after: found };
  }

  function updateRowByNumber(sheetName, rowNumber, updates) {
    var sheet = getSheet(sheetName);
    var headers = getHeaders(sheetName);
    var current = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
    var before = {};
    var after = {};
    headers.forEach(function (header, i) {
      before[header] = current[i];
      after[header] = current[i];
    });
    Object.keys(updates || {}).forEach(function (key) { after[key] = updates[key]; });
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([headers.map(function (header) {
      return after[header] === undefined ? '' : after[header];
    })]);
    return { before: before, after: after };
  }

  function findByKey(sheetName, keyField, keyValue) {
    return readRows(sheetName).find(function (row) {
      return String(row[keyField]) === String(keyValue);
    }) || null;
  }

  function filterRows(sheetName, filters) {
    var rows = readRows(sheetName);
    filters = filters || {};
    return rows.filter(function (row) {
      return Object.keys(filters).every(function (key) {
        var expected = filters[key];
        if (expected === '' || expected === null || expected === undefined) return true;
        if (Array.isArray(expected)) return expected.indexOf(row[key]) !== -1;
        return String(row[key]) === String(expected);
      });
    });
  }

  function toCsv(rows, headers) {
    headers = headers || (rows[0] ? Object.keys(rows[0]).filter(function (h) { return h.charAt(0) !== '_'; }) : []);
    var escape = function (value) {
      var text = value === null || value === undefined ? '' : String(value);
      return '"' + text.replace(/"/g, '""') + '"';
    };
    return [headers.map(escape).join(',')].concat(rows.map(function (row) {
      return headers.map(function (header) { return escape(row[header]); }).join(',');
    })).join('\n');
  }

  function normalizeText(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function nowIso() {
    return Utilities.formatDate(new Date(), APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  }

  function periodMonth(dateValue) {
    var date = dateValue ? new Date(dateValue) : new Date();
    return Utilities.formatDate(date, APP_CONFIG.TIMEZONE, 'yyyyMM');
  }

  function generateHash(parts) {
    var raw = parts.map(function (part) { return String(part || '').trim(); }).join('|').toLowerCase();
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
    return bytes.map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    }).join('');
  }

  return {
    getSpreadsheet: getSpreadsheet,
    getSheet: getSheet,
    getHeaders: getHeaders,
    readRows: readRows,
    appendRow: appendRow,
    updateRowByKey: updateRowByKey,
    updateRowByNumber: updateRowByNumber,
    findByKey: findByKey,
    filterRows: filterRows,
    toCsv: toCsv,
    normalizeText: normalizeText,
    nowIso: nowIso,
    periodMonth: periodMonth,
    generateHash: generateHash
  };
})();
