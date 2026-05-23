-- Tạo bảng lưu trữ dữ liệu nhập liệu từ hiện trường
CREATE TABLE IF NOT EXISTS public.field_forms (
    id UUID PRIMARY KEY,
    workspace_id TEXT,
    project_id TEXT,
    type TEXT NOT NULL,
    title TEXT,
    form_data JSONB NOT NULL,
    status TEXT DEFAULT 'synced',
    approval_status TEXT DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tắt RLS để quá trình test ban đầu dễ dàng (Hoặc bật RLS nếu cần thiết)
ALTER TABLE public.field_forms DISABLE ROW LEVEL SECURITY;

-- Thêm cột approval_status nếu bảng đã tồn tại
ALTER TABLE public.field_forms ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Cấp quyền ẩn danh để có thể INSERT/UPDATE (tạm thời để test)
GRANT ALL ON TABLE public.field_forms TO anon;
GRANT ALL ON TABLE public.field_forms TO authenticated;

-- BẢNG DỰ ÁN (PROJECTS)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Đang chạy',
    progress INTEGER DEFAULT 0,
    members INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.projects TO anon;
GRANT ALL ON TABLE public.projects TO authenticated;

-- Thêm dữ liệu mẫu cho Dự án
INSERT INTO public.projects (name, status, progress, members) VALUES
('TBC San lấp - Công trường A', 'Đang chạy', 68, 12),
('Nâng cấp Quốc lộ - Giai đoạn 2', 'Hoàn thành', 100, 8),
('Kè bờ sông', 'Đang chạy', 24, 15);

-- ==========================================
-- BẢNG MASTER DATA (DANH MỤC)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.master_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT,
    type TEXT NOT NULL, -- e.g., 'vehicle', 'machine', 'material'
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.master_data DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.master_data TO anon;
GRANT ALL ON TABLE public.master_data TO authenticated;

-- Thêm dữ liệu mẫu cho Master Data
INSERT INTO public.master_data (type, value, label) VALUES
('vehicle', '97C-12345', 'Xe 97C-12345 (Hino)'),
('vehicle', '97C-99999', 'Xe 97C-99999 (Howo)'),
('machine', 'MX-01', 'Máy Xúc 01 (Doosan)'),
('machine', 'MX-02', 'Máy Xúc 02 (Komatsu)'),
('material', 'cat_san_lap', 'Cát san lấp'),
('material', 'da_dam', 'Đá dăm'),
('material', 'dat_doi', 'Đất đồi'),
('expense_category', 'xang_dau', 'Đổ xăng / dầu'),
('expense_category', 'sua_chua', 'Sửa chữa / Bảo dưỡng'),
('expense_category', 'vat_tu', 'Mua vật tư phụ'),
('expense_category', 'an_uong', 'Ăn uống / Tiếp khách'),
('worker', 'nguyen_van_a', 'Nguyễn Văn A'),
('worker', 'tran_thuy_b', 'Trần Thị B');

-- ==========================================
-- BUCKET LƯU TRỮ ẢNH (STORAGE)
-- ==========================================
-- 1. Tạo bucket công khai
INSERT INTO storage.buckets (id, name, public) 
VALUES ('field-photos', 'field-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Cho phép xem ảnh public
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'field-photos');
CREATE POLICY "Public Insert Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'field-photos');
CREATE POLICY "Public Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'field-photos');
CREATE POLICY "Public Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'field-photos');
