# Chi Tiết Tính Năng (Features Documentation)

## 1. Màn Hình Khóa (Login/Gatekeeper)
- **File:** `src/components/Gatekeeper.tsx`
- **Mô tả:** Chặn toàn bộ nội dung ứng dụng. Yêu cầu nhập mã truy cập. Các phím số (Numpad) được làm cực lớn để thợ dễ bấm. Nhập sai báo rung và đỏ màn hình.

## 2. Trang Chủ (Dashboard)
- **File:** `src/app/(app)/page.tsx`
- **Mô tả:** 
  - Hiển thị thống kê tổng quan: Tổng giờ máy hôm nay (Real-time từ DB), số dự án đang chạy.
  - Tác vụ nhanh (Quick Actions): 4 nút khổng lồ dẫn thẳng đến các form nhập liệu chuyên biệt (`/input?type=...`).
  - Dữ liệu vừa đẩy lên (Live Feed): Lấy 50 báo cáo mới nhất từ Supabase, hiển thị dạng thẻ (Card) chi tiết. Tích hợp thanh tìm kiếm.
  - Chi phí gần đây: Lọc riêng các báo cáo loại `expense` để hiển thị tóm tắt, kèm nút "Xem tất cả" dẫn sang trang danh sách Chi phí.

## 3. Trung Tâm Nhập Liệu (Input Hub)
- **File:** `src/app/(app)/input/page.tsx`
- **Mô tả:** Sử dụng thiết kế Tabs kết hợp Form linh hoạt. Có 5 loại form chính:
  1. **Điểm danh (Attendance):** Báo cáo số công nhân có mặt, vắng mặt, ghi chú.
  2. **Giờ máy (Machine Hours):** Khai báo mã thiết bị và số giờ hoạt động (có validate).
  3. **Chuyến xe (Transport):** Ghi nhận xe ben, số chuyến, vật liệu (đất, đá, cát).
  4. **Sản lượng (Volume):** Ghi nhận khối lượng thi công (m3, tấn, md).
  5. **Chi phí (Expense):** Báo cáo mua vật tư, đổ dầu, tiếp khách...
- **Ảnh Hiện Trường (Gallery):** Khu vực upload ảnh độc lập. Hỗ trợ chọn nhiều ảnh, xem trước (Preview) qua Base64, ghi chú từng ảnh và lưu Offline chờ đồng bộ.
- **Auto-Routing:** Cho phép mở trực tiếp một tab cụ thể thông qua tham số trên URL (`?type=hours`).

## 4. Danh Sách Chi Phí (Expenses History)
- **File:** `src/app/(app)/expenses/page.tsx`
- **Mô tả:** Trang danh sách chuyên biệt để hiển thị mọi khoản chi phí đã được đẩy lên Cloud. Hiển thị rõ số tiền (màu đỏ cảnh báo), hạng mục và trạng thái phê duyệt (Đã duyệt / Chờ duyệt / Từ chối).

## 5. Trung Tâm Phê Duyệt (Approvals)
- **File:** `src/app/(app)/reports/page.tsx`
- **Mô tả:** Dành cho cấp Quản lý. 
  - Chia làm 3 Tabs: CHỜ DUYỆT, ĐÃ DUYỆT, BỊ TỪ CHỐI.
  - Có các nút Action (Duyệt / Từ chối) thực hiện Mutation thẳng xuống Supabase (`approval_status`).
  - Tích hợp tính năng Lightbox để xem ảnh đính kèm full-screen. Cực kỳ tiện lợi để đối chiếu biên lai, hóa đơn.

## 6. Cơ Sở Dữ Liệu (Database Schema)
Bảng chính: `field_forms` trên Supabase:
- `id` (uuid, primary key)
- `workspace_id` (string) - Phân rã theo chi nhánh.
- `project_id` (string) - Phân rã theo dự án.
- `type` (string) - Loại form (`hours`, `attendance`, `expense`, `volume`, `transport`, `photo`).
- `title` (string) - Tiêu đề tạo tự động (Ví dụ: Giờ máy - 23/05/2026).
- `form_data` (jsonb) - Chứa ruột dữ liệu linh hoạt của từng form (số tiền, biển số xe, URL ảnh...).
- `status` (string) - Trạng thái đồng bộ.
- `approval_status` (string) - Trạng thái duyệt của sếp (`pending`, `approved`, `rejected`).
- `created_at`, `updated_at` (timestamp).
