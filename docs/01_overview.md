# Tổng Quan Dự Án (Project Overview)

## Tên Dự Án
**Trung Bắc Cạn** (App Quản lý Hiện trường / App Lò nung).

## Bối Cảnh & Mục Tiêu
Quá trình ghi nhận số liệu tại hiện trường công trình (như khai thác mỏ, san lấp, xây dựng, lò nung) thường gặp khó khăn do môi trường làm việc khắc nghiệt và kết nối mạng Internet (3G/4G) chập chờn hoặc không có mạng. Các tổ trưởng, quản đốc cần một công cụ siêu đơn giản, phản hồi tức thì để ghi nhận khối lượng công việc, chi phí, giờ máy móc hoạt động mà không bị gián đoạn.

**Mục tiêu cốt lõi:**
- Tạo ra một ứng dụng Web (được thiết kế ưu tiên cho Mobile/PWA) để nhập liệu tại hiện trường.
- **Offline-First**: Hoạt động hoàn hảo ngay cả khi mất mạng. Lưu dữ liệu vào máy (IndexedDB) và tự động đồng bộ (hoặc đồng bộ thủ công) lên Cloud khi có mạng.
- Giao diện siêu dễ dùng: Các nút bấm cực lớn, độ tương phản cao, thao tác 1 chạm, chống bấm nhầm (dành cho người làm hiện trường có thể đang đeo găng tay, tay bẩn hoặc mắt kém).

## Đối Tượng Sử Dụng
1. **Người nhập liệu (Tổ trưởng, Quản đốc hiện trường, Lái máy):** Cần nhập nhanh gọn số chuyến xe, giờ chạy máy, chi phí phát sinh, điểm danh tổ thợ, chụp ảnh công trường.
2. **Người quản lý (Chỉ huy trưởng, Kế toán, Giám đốc):** Theo dõi số liệu theo thời gian thực (Real-time), phê duyệt các khoản chi hoặc báo cáo công việc từ xa.

## Nguyên Lý Thiết Kế (Design Principles)
- **Rugged & Brutalist UI**: Phong cách thiết kế "Nồi đồng cối đá". Sử dụng các đường viền đậm (2px-4px solid black), đổ bóng cứng (hard shadow), font chữ to, in hoa rõ ràng. 
- **Màu sắc (Color Palette)**: Lấy cảm hứng từ đất đá và công trường. Màu chủ đạo là Đất nung/Nâu cam (`#8c4f00`), kết hợp với nền trắng và xám xi măng, tạo cảm giác chắc chắn, công nghiệp và cao cấp (Premium Industrial).
- **Phản hồi tương tác (Feedback)**: Mọi nút bấm đều có hiệu ứng nhấn (scale xuống, mất bóng) và rung (Haptic Feedback qua `navigator.vibrate`) để báo cho người dùng biết thao tác đã thành công.
