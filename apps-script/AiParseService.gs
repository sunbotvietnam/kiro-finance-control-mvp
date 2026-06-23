var AiParseService = (function () {
  function parseFinanceText(rawText, context) {
    var apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
    if (!apiKey) return null;
    var model = PropertiesService.getScriptProperties().getProperty('OPENAI_MODEL') || 'gpt-4.1-mini';
    var prompt = [
      'Bạn là bộ phân loại giao dịch tài chính nội bộ Kiro.',
      'Trả về duy nhất JSON hợp lệ với các trường:',
      'transaction_date, direction, amount, account_hint, counterparty_text, category_code, description, confidence.',
      'direction chỉ dùng inflow/outflow/transfer.',
      'category_code phải ưu tiên một trong DM_CATEGORY hiện có.',
      'Nếu là SMS trừ tiền/in ấn/chứng nhận/ấn phẩm/media/quảng lịch thì ưu tiên MEDIA.',
      'Nếu là thu từ trường mầm non thì dùng THUHD và counterparty_text là tên trường.',
      'Không tự bịa dữ liệu nếu không chắc; confidence 0-1.',
      'DM_CATEGORY: ' + (context && context.categories ? context.categories.join(', ') : ''),
      'Nội dung cần đọc:',
      rawText
    ].join('\n');
    var res = UrlFetchApp.fetch('https://api.openai.com/v1/responses', {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: model,
        input: prompt,
        temperature: 0,
        text: { format: { type: 'json_object' } }
      })
    });
    if (res.getResponseCode() < 200 || res.getResponseCode() >= 300) return null;
    var data = JSON.parse(res.getContentText());
    var text = data.output_text;
    if (!text && data.output && data.output.length) {
      var content = data.output[0].content || [];
      text = content.length ? content[0].text : '';
    }
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (err) {
      return null;
    }
  }

  return {
    parseFinanceText: parseFinanceText
  };
})();
