# Lộ Trình Phát Triển (Roadmap & Next Steps)

## ✅ Đã Hoàn Thành (Phases 1 - 4)

1. **Giao diện cốt lõi (Premium Brutalism UI):** Hệ thống được thiết kế đồng nhất theo phong cách Brutalism - To, Rõ, Đậm, Tương phản mạnh (Shadow đen dày). Tối ưu hóa trải nghiệm trên màn hình điện thoại cho công nhân.
2. **Hệ thống Nhập liệu Toàn diện:** 6 module báo cáo chuyên biệt (Điểm danh, Giờ máy, Chuyến xe, Sản lượng, Chi phí, Hình ảnh) với cơ chế Validate dữ liệu cực kỳ chặt chẽ.
3. **PWA & Chế độ Offline:** Loại bỏ hoàn toàn sự phụ thuộc vào mạng. Gắn `sw.js` (Vanilla Service Worker) để lưu Cache. Sử dụng IndexedDB (Dexie) kết hợp `SyncManager` để đồng bộ dữ liệu ngầm lên Supabase khi có sóng.
4. **Trung tâm Báo cáo (Analytics):** Màn hình `/reports` với Recharts. Hiển thị 4 chỉ số cốt lõi, Biểu đồ Chi phí (Pie chart), Biểu đồ Vận hành (Bar chart) và tính năng lọc theo thời gian thực.
5. **Tháp Phê Duyệt (Approvals):** Màn hình `/approvals` cho phép Admin kiểm duyệt mọi dữ liệu đẩy về từ công trường. Tính năng xem chi tiết thông minh và duyệt hàng loạt.

---

## 🚀 Các Hạng Mục Chờ Xử Lý (To-do List - Next Phases)

1. **Xử lý Ảnh Khối lượng lớn (Supabase Storage):**
   - Hiện tại ảnh đính kèm đang được nén lại và lưu nguyên cục dưới dạng chuỗi `Base64` vào cột JSON của Database. Cách này giúp Offline hoạt động trơn tru nhưng về lâu dài sẽ làm quá tải Database.
   - **Mục tiêu tương lai:** Khi có mạng, tự động đẩy file ảnh gốc lên Supabase Storage (hoặc S3 Bucket) -> Lấy URL ảnh (Public link) -> Cập nhật URL đó vào `form_data` thay vì chuỗi Base64.

2. **Quản lý Danh mục Gốc (Master Data CRUD):**
   - Khu vực "Thêm" (`/more`) cần xây dựng tính năng Quản lý Danh Mục cho Admin.
   - Cho phép Sếp Thêm/Sửa/Xóa: Danh sách Mã máy xúc, Biển số xe ben, Danh sách Công nhân, Danh mục Hạng mục Chi phí.
   - Các Form nhập liệu hiện đang dùng dữ liệu điền tay hoặc hardcode sẽ được trỏ thẳng vào Master Data này để tạo thành các Select Box động (Combobox).

3. **Cảnh Báo & Thông báo Đẩy (Push Notifications):**
   - Áp dụng Firebase Cloud Messaging (FCM) hoặc Web Push API.
   - Kịch bản: Cảnh báo ngay cho Sếp khi có Báo cáo Chi phí > 10 triệu đồng. Báo cho công nhân biết khi phiếu báo cáo của họ vừa bị "Từ chối" kèm lý do.

4. **Kiểm tra Tọa độ (GPS Tracking) & Chống gian lận:**
   - Khi công nhân bấm gửi báo cáo, đính kèm luôn tọa độ GPS hiện tại (nếu họ cho phép trình duyệt truy cập Vị trí).
   - Xác minh xem thợ có thực sự đang đứng ở tọa độ của dự án hay đang nằm ở nhà báo cáo láo.

---

## 🛡️ Nguyên Tắc Khi Nâng Cấp Code
- **Bảo toàn Thẩm mỹ:** Bất kỳ Component nào thêm vào đều phải tuân thủ nghiêm ngặt CSS của Brutalism (Ví dụ: `border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(25,28,30,1)]`).
- **Offline-First:** Bất kỳ tính năng mới nào liên quan đến NHẬP LIỆU đều phải ưu tiên luồng: `Lưu Local (IndexedDB)` -> `Lắng nghe kết nối` -> `Sync lên Cloud`. Không bao giờ gọi API chèn thẳng lên mạng.
- **Isolated Development:** Khi tạo tính năng lớn, hãy tạo folder `/route` mới. Tuyệt đối hạn chế chọc phá quá sâu vào các màn hình đã vận hành trơn tru để tránh hiệu ứng domino.
