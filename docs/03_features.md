# Chi Tiết Tính Năng (Features Documentation)

## 1. Màn Hình Khóa (Login/Gatekeeper)
- **File:** `src/components/Gatekeeper.tsx`
- **Mô tả:** Chặn toàn bộ nội dung ứng dụng. Yêu cầu nhập mã truy cập. Các phím số (Numpad) được làm cực lớn để thợ dễ bấm. 

## 2. Trang Chủ (Dashboard)
- **File:** `src/app/(app)/page.tsx`
- **Mô tả:** 
  - Hiển thị thống kê tổng quan: Tổng giờ máy hôm nay (Real-time từ DB), số dự án đang chạy.
  - Tác vụ nhanh (Quick Actions): 4 nút khổng lồ dẫn thẳng đến các form nhập liệu chuyên biệt.
  - Dữ liệu vừa đẩy lên (Live Feed): Lấy các báo cáo mới nhất, hiển thị dạng thẻ (Card) chi tiết. 

## 3. Trung Tâm Nhập Liệu (Input Hub)
- **File:** `src/app/(app)/input/page.tsx`
- **Mô tả:** Hệ thống Form nhập liệu với 6 loại báo cáo:
  1. Điểm danh (Attendance)
  2. Giờ máy (Machine Hours)
  3. Chuyến xe (Transport)
  4. Sản lượng (Volume)
  5. Chi phí (Expense)
  6. Hình ảnh (Photo)
- Tích hợp lưu Offline thông qua Dexie (`src/lib/db.ts`).

## 4. Quản lý Đồng Bộ & Offline (Sync & PWA)
- **File:** `src/components/SyncManager.tsx` & `public/sw.js`
- **Mô tả:** Vanilla Service Worker (sw.js) đảm bảo app cài đặt được và chạy không cần mạng. SyncManager lắng nghe sự kiện `online`/`offline`, đẩy dữ liệu từ IndexedDB (Local) lên Supabase khi có kết nối mạng, và hiển thị thông báo trạng thái.

## 5. Báo Cáo Phân Tích (Analytics Control Center)
- **File:** `src/app/(app)/reports/page.tsx`
- **Mô tả:** Bảng điều khiển phân tích chi tiết. Hiển thị 4 chỉ số cốt lõi (Chi phí, Chuyến xe, Giờ máy, Nhân công). Có Biểu đồ Tròn (Pie chart) cho chi phí, Biểu đồ Cột kép (Dual Bar chart) cho Vận hành. Bộ lọc đa chiều (Thời gian, Dự án). Modal xem chi tiết từng báo cáo cực kỳ trực quan.

## 6. Tháp Phê Duyệt (Approvals)
- **File:** `src/app/(app)/approvals/page.tsx`
- **Mô tả:** Dành cho cấp Quản trị (Admin). Nằm ngay trên Bottom Nav Bar.
  - Phân loại 3 Tabs: CHỜ DUYỆT, ĐÃ DUYỆT, TỪ CHỐI.
  - Nút Phê duyệt hàng loạt (Approve All). Bấm vào báo cáo để mở Modal chi tiết. Cập nhật trạng thái duyệt thẳng lên Supabase.

## 7. Cơ Sở Dữ Liệu (Database Schema)
Bảng chính: `field_forms` trên Supabase:
- `id` (uuid, primary key)
- `workspace_id`, `project_id` (string)
- `type` (string) - Loại form (`hours`, `expense`...)
- `title` (string)
- `form_data` (jsonb) - Chứa cấu trúc JSON linh hoạt của từng loại báo cáo.
- `status` (string) - Trạng thái đồng bộ (`synced`).
- `approval_status` (string) - Trạng thái phê duyệt của sếp (`pending`, `approved`, `rejected`).
- `created_at` (timestamp)
