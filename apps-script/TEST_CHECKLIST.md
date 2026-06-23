# Checklist test thủ công

## A. Khởi tạo

- [ ] Chạy `setupFinanceCore()` không lỗi.
- [ ] Google Sheet có đủ sheet/header bắt buộc.
- [ ] `DM_CATEGORY` có đủ mã: `THUHD`, `THUNO`, `UNGHD`, `THUKHAC`, `HOAHONG`, `LUONG-BH`, `THUONG`, `TAMUNG`, `BAOHIEM`, `THUE`, `MUANGOAI`, `PHAPLY`, `VANTAI`, `THUEMATBANG`, `MUATSTB`, `LUANCHUYEN`, `CHIKHAC`.
- [ ] `LUANCHUYEN.direction = transfer`.
- [ ] `DM_STAFF` có staff mẫu và giáo viên dùng `staff_type = teacher`.
- [ ] Không có role `TEACHER` trong role lõi.

## B. Nhập nhanh

- [ ] Mở web app thấy tab `Tổng quan`, `Nhập nhanh`, `Sổ dòng tiền`, `Hộp chờ xác nhận`, `Chứng từ & thuế`, `Báo cáo`, `Cấu hình`.
- [ ] Tạo giao dịch thu dưới 30 giây.
- [ ] Tạo giao dịch chi dưới 30 giây.
- [ ] Mỗi giao dịch có `transaction_id` dạng `TX-YYYYMM-000001`.
- [ ] Giao dịch có `source_system`, `source_id`, `duplicate_hash`.
- [ ] Giao dịch thiếu đối tượng hoặc chứng từ cần thiết được đánh dấu `needs_review`.

## C. Luân chuyển nội bộ

- [ ] Tạo giao dịch `direction = transfer`, mã khoản `LUANCHUYEN`.
- [ ] Dashboard không cộng transfer vào tổng thu.
- [ ] Dashboard không cộng transfer vào tổng chi.

## D. Sổ dòng tiền

- [ ] Lọc theo tháng `YYYYMM`.
- [ ] Lọc theo thu/chi/luân chuyển.
- [ ] Lọc theo mã khoản.
- [ ] Lọc theo tài khoản.
- [ ] Hủy giao dịch bằng nút `Hủy`.
- [ ] Giao dịch hủy có `status = cancelled`, không bị xóa khỏi sheet.
- [ ] `AUDIT_LOG` ghi create/cancel.
- [ ] Export CSV tải được file.

## E. Hộp chờ xác nhận

- [ ] Dán một SMS/email ngân hàng vào `Hộp chờ xác nhận`.
- [ ] Hệ thống tạo dòng trong `IMPORT_STAGING`.
- [ ] Có parse số tiền.
- [ ] Có parse chiều thu/chi cơ bản.
- [ ] Có gợi ý mã khoản.
- [ ] Bấm `Xác nhận` tạo transaction.
- [ ] Bấm `Bỏ qua` đổi `review_status = ignored`.
- [ ] Bấm `Trùng` đổi `review_status = duplicate`.
- [ ] Dữ liệu staging chưa xác nhận không xuất hiện trong `TRANSACTIONS`.

## F. Chứng từ & thuế

- [ ] Giao dịch chi thiếu chứng từ tạo dòng `TAX_FLAGS`.
- [ ] Chi tiền mặt lớn tạo risk `high`.
- [ ] Chi lớn chuyển khoản thiếu hóa đơn tạo risk `medium`.
- [ ] Luân chuyển nội bộ có tax flag `not_applicable`.
- [ ] UI `Chứng từ & thuế` hiển thị summary risk.

## G. Báo cáo

- [ ] `Tổng quan tài chính` hiển thị tiền khả dụng, thu tháng, chi tháng, dòng tiền thuần.
- [ ] Có tồn theo tài khoản tiền.
- [ ] Có top nhóm chi.
- [ ] Có giao dịch cần rà soát, thiếu chứng từ, chưa match.
- [ ] Có forecast 4 tuần nếu nhập `CASH_PLANS`.
- [ ] `Báo cáo` hiển thị điều hành rút gọn.
- [ ] `Báo cáo` hiển thị tài chính cơ bản.
- [ ] Export Data Quality CSV hoạt động.

## H. Hook mở rộng

- [ ] `TRANSACTIONS` có `approval_request_id`.
- [ ] `TRANSACTIONS` có `payment_order_id`.
- [ ] `TRANSACTIONS` có `document_id`.
- [ ] Sheet `APPROVAL_REQUESTS` và `APPROVAL_REQUEST_LINES` có header.
- [ ] Sheet `PAYMENT_ORDERS` và `PAYMENT_ORDER_LINES` có header.
- [ ] Sheet `DOCUMENT_TEMPLATES` và `DOCUMENTS` có header.
