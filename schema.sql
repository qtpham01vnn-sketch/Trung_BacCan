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
