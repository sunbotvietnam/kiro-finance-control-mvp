# KIRO FINANCE CONTROL MVP

## 1. Hệ thống này là gì

Kiro Finance Control MVP là bản Cash Flow Core chạy trên Google Apps Script + Google Sheets. Mục tiêu là ghi nhận dòng tiền thật, staging dữ liệu ngân hàng trước khi vào sổ chính, theo dõi chứng từ/thuế cơ bản, báo cáo điều hành và để sẵn hook cho Approval Request, Payment Order, Document Center.

MVP này không phải phần mềm kế toán thuế đầy đủ. Đây là hệ thống quản trị dòng tiền và kiểm soát dữ liệu nội bộ để sau này đưa vào Sunbot Command Center.

## 2. Cấu trúc file

```text
Code.gs
Config.gs
DataService.gs
SchemaService.gs
SequenceService.gs
MasterDataService.gs
TransactionService.gs
ImportStagingService.gs
EvidenceService.gs
TaxService.gs
ForecastService.gs
ReportService.gs
AuditService.gs
PermissionService.gs
DocumentHookService.gs
ApprovalHookService.gs
PaymentOrderHookService.gs
Index.html
styles.html
app.html
components.html
appsscript.json
README.md
TEST_CHECKLIST.md
```

## 3. Cách tạo Google Sheet

1. Tạo một Google Sheet mới, ví dụ `KIRO_FINANCE_CONTROL_DATA`.
2. Copy Sheet ID trong URL:

```text
https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
```

3. Sheet có thể để trống. Hàm `setupFinanceCore()` sẽ tự tạo sheet/header/seed.

## 4. Cách gắn Sheet ID vào Apps Script

1. Mở Apps Script.
2. Tạo project mới.
3. Tạo đúng các file trong thư mục này và copy nội dung vào.
4. Vào `Project Settings` -> `Script Properties`.
5. Thêm:

```text
FINANCE_SHEET_ID = <SHEET_ID>
```

Nếu project Apps Script được tạo trực tiếp từ Google Sheet, có thể không cần `FINANCE_SHEET_ID`; hệ thống sẽ dùng spreadsheet đang active.

## 5. Cách chạy `ensureRequiredSheets`

Trong Apps Script editor:

1. Chọn hàm `setupFinanceCore`.
2. Bấm Run.
3. Cấp quyền truy cập Google Sheets/Drive nếu được hỏi.
4. Kiểm tra Google Sheet đã có các bảng:

```text
SYSTEM_CONFIG
SEQUENCE_REGISTRY
DM_CATEGORY
DM_ACCOUNT
DM_STAFF
DM_SCHOOL
DM_SITE
DM_VENDOR
DM_PARTNER
DM_COUNTERPARTY
DM_ALIAS_MAP
TRANSACTIONS
IMPORT_STAGING
EVIDENCE
TAX_FLAGS
CASH_PLANS
APPROVAL_REQUESTS
APPROVAL_REQUEST_LINES
PAYMENT_ORDERS
PAYMENT_ORDER_LINES
DOCUMENT_TEMPLATES
DOCUMENTS
AUDIT_LOG
METRIC_CATALOG
NOTIFICATION_RULES
AUTH_USERS
```

`AUTH_USERS` là sheet hỗ trợ permission MVP, thêm ngoài data core để không hard-code user/role.

## 6. Cách deploy Web App

1. Apps Script -> `Deploy` -> `New deployment`.
2. Chọn type `Web app`.
3. Execute as: `Me`.
4. Who has access: chọn theo chính sách nội bộ, thường là `Anyone within organization` nếu dùng Google Workspace.
5. Deploy và mở URL web app.

## 7. Cách thêm mã khoản

Thêm dòng vào `DM_CATEGORY`.

Cột quan trọng:

```text
category_code
category_name
direction
is_internal_transfer
requires_invoice_default
requires_approval_default
requires_payment_order_default
active_status
```

Lưu ý: `LUANCHUYEN` phải giữ `direction = transfer` và `is_internal_transfer = true`.

## 8. Cách thêm tài khoản tiền

Thêm dòng vào `DM_ACCOUNT`.

Ví dụ:

```text
VCB-002 | Vietcombank quỹ sự kiện | bank | Vietcombank | ****888 | HN | KIRO_INTERNAL | 0 | active
```

`opening_balance` là số dư đầu kỳ để dashboard tính tiền khả dụng.

## 9. Cách thêm staff

Thêm dòng vào `DM_STAFF`.

Không tạo role `TEACHER`. Giáo viên Sunbot được biểu diễn bằng:

```text
staff_type = teacher
role kỹ thuật nếu dùng portal = OPERATION_STAFF
```

## 10. Cách nhập giao dịch

Vào tab `Nhập nhanh`.

Chọn một chế độ:

```text
Tôi nhận tiền
Tôi chi tiền
Tôi chuyển quỹ
Tôi tạm ứng
Tôi quyết toán
```

Điền các trường chính: ngày, số tiền, tài khoản, mã khoản, đối tượng/nhân sự nếu có, nội dung, trạng thái chứng từ.

Khi lưu, hệ thống tự sinh `transaction_id` dạng:

```text
TX-202606-000001
```

Mọi giao dịch có `source_system`, `source_id`, `duplicate_hash`. Nếu thiếu đối tượng hoặc chứng từ bắt buộc, trạng thái có thể là `needs_review`.

## 11. Cách dùng staging

Vào tab `Hộp chờ xác nhận`.

1. Dán SMS/email ngân hàng.
2. Bấm `Đưa vào hộp chờ`.
3. Hệ thống parse ngày, số tiền, chiều thu/chi, tài khoản nếu nhận diện được.
4. Dòng mới vào `IMPORT_STAGING`.
5. Bấm `Xác nhận` để tạo transaction chính thức.
6. Có thể bấm `Bỏ qua` hoặc `Trùng`.

Nguyên tắc: dữ liệu ngoài không vào `TRANSACTIONS` nếu chưa xác nhận.

## 12. Cách export

Trong `Sổ dòng tiền`, bấm `Export CSV` để xuất `Transactions CSV`.

Trong `Báo cáo`, bấm `Export Data Quality` để xuất lỗi dữ liệu.

API có sẵn:

```javascript
apiExportTransactionsCsv(filters)
apiExportCashSummaryCsv(filters)
apiExportDataQualityCsv()
```

## 13. Cách sau này bật Approval Request

Schema đã có:

```text
APPROVAL_REQUESTS
APPROVAL_REQUEST_LINES
approval_request_id trong TRANSACTIONS
ApprovalHookService
```

Khi mở module, thêm UI form đề xuất chi, dùng `SequenceService.getNextSequence('approval_request', 'AP')`, workflow `draft -> submitted -> approved/rejected`.

Approval Request không sinh transaction actual. Nếu approved, có thể tạo committed cash plan hoặc Payment Order.

## 14. Cách sau này bật Payment Order

Schema đã có:

```text
PAYMENT_ORDERS
PAYMENT_ORDER_LINES
payment_order_id trong TRANSACTIONS
PaymentOrderHookService
```

Khi mở module, dùng `SequenceService.getNextSequence('payment_order', 'PAY')`. Chỉ khi `PAYMENT_ORDERS.status = paid` mới sinh transaction `outflow`.

## 15. Cách sau này bật Document Center

Schema đã có:

```text
DOCUMENT_TEMPLATES
DOCUMENTS
document_id trong TRANSACTIONS
DocumentHookService
```

Document Center chỉ sinh hồ sơ từ dữ liệu gốc. Không dùng file hồ sơ làm database chính.

## 16. Các giới hạn của MVP

- Parser SMS/email ngân hàng là rule-based cơ bản, chưa dùng AI.
- Permission đã có server-side role/scope cơ bản, chưa phải Command Center đầy đủ.
- Transfer MVP không cộng vào tổng thu/tổng chi. Nếu cần phản ánh chuyển từ tài khoản A sang B chi tiết hơn, nên mở thêm cặp bút toán transfer-out/transfer-in hoặc trường account đích ở giai đoạn sau.
- Tax module chỉ cảnh báo cơ bản, không tự kết luận thuế.
- Chưa có import Excel/sao kê batch.
- Chưa có UI full cho Approval Request, Payment Order, Document Center.
