# Lộ Trình Phát Triển (Roadmap & Next Steps)

## Các Hạng Mục Chờ Xử Lý (To-do List)

1. **Hoàn thiện tab "Mở Rộng" (Tab THÊM - `/more`):**
   - Thiết kế giao diện Quản trị viên tại đây.
   - Cung cấp nút Đăng Xuất (Logout).
   - Module Quản lý Danh mục (Master Data): Xây dựng giao diện để thêm/sửa/xóa các mã máy xúc, biển số xe, phân khu thi công. Sau đó liên kết các trường dữ liệu này vào trong các Select Box ở trang Nhập liệu (thay vì gõ tay như hiện tại).
   - Nút quản lý bộ nhớ đệm và ép đồng bộ (Force Sync Button).

2. **Xây dựng hệ thống PWA (Offline) Chuẩn Chỉ:**
   - Thay thế `next-pwa` (đã xóa vì lỗi Vercel) bằng một Service Worker được tùy biến (Custom Workbox / Service Worker API).
   - Tối ưu hóa bộ đệm (Caching) cho các tài sản tĩnh (ảnh, css, js) và các lệnh gọi API (Network First vs Cache First).
   - Triển khai tính năng **Background Sync API** để tự động đẩy dữ liệu khi có mạng mà không cần mở App.

3. **Xử lý Ảnh Khối lượng lớn (File Uploading):**
   - Hiện tại ảnh đang lưu dưới dạng chuỗi `Base64` vào thẳng cột JSON của database. Cách này tốt cho lưu Offline ngắn hạn, nhưng về lâu dài sẽ làm phình to DB.
   - **Giải pháp tiếp theo:** Tạo một Storage Bucket trên Supabase. Khi đồng bộ, sẽ upload file ảnh gốc lên Storage -> Lấy URL public -> Cập nhật URL đó vào `form_data`.

4. **Biểu đồ và Thống kê Nâng cao:**
   - Trang `/reports` hiện tại là bảng phê duyệt. Cần xây dựng thêm trang `/analytics` với các biểu đồ Bar chart, Pie chart (có thể dùng Recharts hoặc Chart.js) để trực quan hóa: Tổng chi phí theo tuần, năng suất chạy máy, sản lượng khai thác.

5. **Phân quyền người dùng (Role-Based Access Control):**
   - Thợ hiện trường: Chỉ được quyền Nhập và xem dữ liệu cá nhân.
   - Sếp / Kế toán: Có quyền Phê duyệt (`approval_status`) và xem biểu đồ tổng.
   - (Hiện tại `Zustand` đã có mock up biến `role`, cần gắn chặt nó với logic chặn Router trong tương lai).

## Nguyên Tắc Khi Nâng Cấp Code
- **Bảo toàn Giao diện:** Tuyệt đối không sử dụng các UI elements mỏng manh, phức tạp. Cứ "To, Rõ, Đậm, Tương phản mạnh" mà làm.
- **Isolated Development:** Khi tạo tính năng mới, hãy tạo component hoặc file/route mới (như cách đã làm với `/expenses`). Hạn chế sửa trực tiếp vào mã nguồn của màn hình đã hoạt động ổn định để tránh hiệu ứng domino gây sập Vercel (như lỗi TypeScript Type Check).
