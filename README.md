# KIRO Finance Control MVP

Cash Flow Core MVP cho Kiro/Sunbot.

Repo này có 2 phần:

1. `docs/` - bản GitHub Pages app chạy ngay trên trình duyệt bằng localStorage, phù hợp demo/quy trình nhập nhanh.
2. `apps-script/` - source Google Apps Script để nối Google Sheets làm data core thật.

## Link dữ liệu Google Sheets

Data core đã tạo sẵn:

https://docs.google.com/spreadsheets/d/1E-Dfa2k3XRRDJ8dC6PfEGzshZ37jTkA3bUVk1o9PtvE/edit

Sheet ID:

```text
1E-Dfa2k3XRRDJ8dC6PfEGzshZ37jTkA3bUVk1o9PtvE
```

## Cách dùng nhanh trên GitHub Pages

Mở GitHub Pages URL của repo sau khi Pages được bật.

Bản này dùng localStorage, không ghi vào Google Sheets. Nó dùng để:

- test UX nhập nhanh;
- demo dashboard;
- kiểm tra staging SMS/email ngân hàng;
- export CSV;
- thống nhất workflow trước khi deploy Apps Script.

## Cách dùng bản vận hành Google Sheets

1. Mở Apps Script.
2. Tạo project mới.
3. Copy toàn bộ file trong `apps-script/` vào project.
4. Vào `Project Settings` -> `Script Properties`.
5. Thêm:

```text
FINANCE_SHEET_ID=1E-Dfa2k3XRRDJ8dC6PfEGzshZ37jTkA3bUVk1o9PtvE
```

6. Chạy `setupFinanceCore()`.
7. Deploy Web App.

## Cấu trúc

```text
apps-script/
  Code.gs
  Config.gs
  DataService.gs
  ...
docs/
  index.html
data-template/
  KIRO_FINANCE_CONTROL_DATA_MVP.xlsx
```

## Nguyên tắc lõi đã giữ

- Cash Flow Core trước.
- Không dùng role `TEACHER`.
- Dùng `OPERATION_STAFF`.
- Giáo viên Sunbot là `DM_STAFF.staff_type = teacher`.
- Dữ liệu ngoài vào `IMPORT_STAGING` trước.
- Transaction có `transaction_id`, `source_system`, `source_id`, `duplicate_hash`.
- Không xóa cứng giao dịch tài chính.
- Transfer không tính vào tổng thu/tổng chi thực.
- Có hook cho Approval Request, Payment Order, Document Center.

