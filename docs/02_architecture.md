# Kiến Trúc Hệ Thống & Công Nghệ (Architecture & Tech Stack)

## Technology Stack
1. **Frontend Framework:** Next.js (App Router) với React 18+. Sử dụng TypeScript để đảm bảo tính chặt chẽ của mã nguồn.
2. **Styling:** Tailwind CSS. Hệ thống Design Token được thiết lập sẵn trong `tailwind.config.ts` và `globals.css` (màu sắc, typography theo chuẩn Material 3 nhưng được tùy biến thành phong cách Rugged).
3. **Database (Cloud):** Supabase (PostgreSQL). Cung cấp cơ sở dữ liệu thời gian thực và API backend không cần server (Serverless).
4. **Database (Local/Offline):** Dexie.js (Một wrapper mạnh mẽ của IndexedDB). Được dùng để lưu trữ dữ liệu tạm thời dưới trình duyệt khi không có mạng.
5. **State Management:** 
   - `Zustand`: Dùng để quản lý trạng thái Đăng nhập (Auth Store) và các trạng thái toàn cục khác.
   - `@tanstack/react-query`: Dùng để gọi API lên Supabase, tự động quản lý bộ nhớ đệm (cache), loading, error states.
6. **Hosting:** Vercel (CI/CD tự động từ GitHub).

## Luồng Hoạt Động Cốt Lõi (Core Workflows)

### 1. Cơ chế Offline-First (Lưu Offline & Đồng bộ)
Đây là "trái tim" của ứng dụng:
- **Bước 1 (Nhập liệu):** Khi người dùng điền form và bấm "LƯU OFFLINE", dữ liệu không gửi thẳng lên mạng. Thay vào đó, nó được đóng gói thành một đối tượng `FieldForm` (có ID duy nhất tạo bằng `uuid`) và ghi vào **Dexie.js (LocalDB)** với trạng thái `status: "pending_sync"`.
- **Bước 2 (Ghi nhận Offline):** Giao diện ngay lập tức thông báo thành công và đếm số lượng mục đang chờ đồng bộ, giúp người dùng an tâm tắt máy đi làm việc khác.
- **Bước 3 (Đồng bộ lên Cloud):** Khi có mạng (hoặc khi người dùng bấm nút "Đồng bộ"), hệ thống sẽ đọc tất cả các bản ghi có `status === "pending_sync"` từ Dexie, gửi chúng lên bảng `field_forms` trên Supabase. Nếu Supabase báo thành công, bản ghi dưới Local sẽ được đánh dấu là `status: "synced"` hoặc bị xóa để giải phóng bộ nhớ.

### 2. Luồng Bảo mật (Authentication)
- App hiện tại không sử dụng cơ chế Login rườm rà bằng Email/Password của Supabase Auth để tránh phức tạp cho thợ hiện trường.
- App sử dụng **PIN Code / Access Code** đơn giản (quản lý bởi `Zustand`). Bất cứ ai truy cập đều phải nhập đúng mã bảo vệ mới được vào Trang chủ. Trạng thái này lưu trong bộ nhớ máy (Local Storage qua persist của Zustand) để không phải nhập lại mỗi lần mở app.

### 3. Progressive Web App (PWA)
- App được cấu hình để có thể "Thêm vào màn hình chính" (Add to Home Screen) trên cả iOS và Android, hoạt động y hệt một ứng dụng Native với icon riêng, màn hình giật gân (Splash Screen) và ẩn thanh địa chỉ.
- *Lưu ý:* Thư viện `next-pwa` đã bị gỡ bỏ tạm thời khỏi Vercel vì gây lỗi tương thích với Turbopack. Bộ nhớ đệm Service Worker cũ đang được thiết lập lệnh tự hủy (unregister) để nhường chỗ cho bản vá mới. Cần cấu hình lại SW sạch sẽ trong tương lai.
