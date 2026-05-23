-- Hướng dẫn Tạo Tài Khoản trong Supabase (Dành cho Sếp)

-- Cách 1: Tạo trực tiếp trên giao diện Supabase (KHUYÊN DÙNG vì an toàn nhất)
-- 1. Đăng nhập vào trang quản trị Supabase của dự án Trung Bắc Cạn.
-- 2. Chọn menu "Authentication" ở cột bên trái.
-- 3. Bấm vào nút "Add user" -> "Create new user" ở góc trên bên phải.
-- 4. Tạo tài khoản 1 (Sếp):
--    - Email: admin@trungbaccan.vn
--    - Password: 123456 (Hoặc mật khẩu sếp muốn)
--    - Đảm bảo "Auto Confirm User" được tích xanh.
-- 5. Tạo tài khoản 2 (Công nhân):
--    - Email: congnhan@test.com
--    - Password: 123456
--    - Tích xanh "Auto Confirm User".

-----------------------------------------------------------

-- Cách 2: Nếu sếp muốn chạy lệnh SQL cho nhanh (Dán vào SQL Editor trong Supabase rồi bấm Run)

-- Bật extension pgcrypto (cần thiết để mã hóa mật khẩu)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- LƯU Ý: Cách chạy SQL có thể bị lỗi ở các phiên bản Supabase mới vì thiếu bảng auth.identities.
-- Khuyến khích sếp làm theo Cách 1 ở trên.
