-- 1. KÍCH HOẠT TIỆN ÍCH AI
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. ĐỊNH NGHĨA CÁC LOẠI TRẠNG THÁI
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'locked');
CREATE TYPE public.survey_status AS ENUM ('draft', 'published', 'closed');

-- 3. BẢNG PHÂN QUYỀN (Admin sẽ gán Role cho User)
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'ADMIN', 'LECTURER', 'STUDENT', 'ALUMNI', 'EMPLOYER'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BẢNG NGƯỜI DÙNG (Quản lý nội bộ - Không tự đăng ký)
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL, -- Mã sinh viên hoặc mã giảng viên
    password_hash TEXT NOT NULL,           -- Admin khởi tạo mật khẩu mặc định
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    status public.user_status DEFAULT 'active',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng trung gian gán quyền (Một người có thể có nhiều vai trò)
CREATE TABLE public.user_roles (
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    role_id INT REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 5. CƠ CẤU TỔ CHỨC (Khoa, Ngành, Lớp)
CREATE TABLE public.faculties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE public.majors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    faculty_id INT REFERENCES public.faculties(id) ON DELETE CASCADE
);

CREATE TABLE public.classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    major_id INT REFERENCES public.majors(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) -- Khóa: 2020-2024
);

-- 6. THÔNG TIN CHI TIẾT THEO VAI TRÒ (Admin nhập liệu hoặc Import từ Excel)
CREATE TABLE public.profile_details (
    user_id INT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    faculty_id INT REFERENCES public.faculties(id),
    major_id INT REFERENCES public.majors(id),
    class_id INT REFERENCES public.classes(id),
    
    student_code VARCHAR(50), -- Mã số SV
    lecturer_code VARCHAR(50), -- Mã số GV
    
    is_alumni BOOLEAN DEFAULT FALSE,
    graduation_year INT,
    
    -- Trường mở rộng cho DN (nếu role là EMPLOYER)
    company_name VARCHAR(255),
    
    -- Dữ liệu bổ sung dạng JSON để linh hoạt cho AI phân tích
    metadata JSONB DEFAULT '{}' 
);

-- 7. QUẢN LÝ KHẢO SÁT
CREATE TABLE public.surveys (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Cấu trúc đề: Sections -> Questions -> Options
    content JSONB NOT NULL DEFAULT '{"sections": []}', 
    
    status public.survey_status DEFAULT 'draft',
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Đối tượng mục tiêu (Dùng để filter khảo sát cho từng User)
    -- Ví dụ: {"target_roles": ["STUDENT"], "target_faculties": [1, 2]}
    target_config JSONB DEFAULT '{}', 
    
    created_by INT REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. KẾT QUẢ KHẢO SÁT & DỮ LIỆU AI
CREATE TABLE public.survey_responses (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES public.surveys(id) ON DELETE CASCADE,
    user_id INT REFERENCES public.users(id) ON DELETE SET NULL, -- Lưu vết người làm (nếu không ẩn danh)
    
    -- Câu trả lời chi tiết
    answers JSONB NOT NULL, 
    
    -- PHẦN DÀNH CHO AI
    -- 1. Văn bản thô để AI quét
    raw_content_text TEXT, 
    -- 2. Vector để tìm kiếm ý nghĩa (Semantic Search)
    embedding vector(1536), 
    -- 3. Kết quả AI phân loại (Sentiment, Topic, Urgency)
    ai_classification JSONB DEFAULT '{}', 
    
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- BẢNG THỐNG KÊ TỔNG HỢP & CHI TIẾT (Thay thế hoàn toàn 3 bảng Mongo cũ)
CREATE TABLE public.survey_stats (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES public.surveys(id) ON DELETE CASCADE,
    
    -- Phân đoạn thống kê: 'OVERALL', 'FACULTY', 'ROLE', 'CLASS'
    segment_type VARCHAR(50) DEFAULT 'OVERALL', 
    
    -- Giá trị của phân đoạn: 'ALL', 'KHOA_CNTT', 'STUDENT', v.v.
    segment_value VARCHAR(100) DEFAULT 'ALL', 
    
    total_responses INT DEFAULT 0,
    
    -- DỮ LIỆU THỐNG KÊ CHI TIẾT (JSONB)
    -- Lưu dạng: {
    --   "q_1": {"total": 100, "distribution": {"A": 20, "B": 80}, "avg": 4.5},
    --   "q_2": {"total": 100, "distribution": {"1": 5, "2": 15...}}
    -- }
    question_analysis JSONB DEFAULT '{}',
    
    -- Phân bổ nhân khẩu học để vẽ biểu đồ tròn nhanh
    -- { "faculties": {"CNTT": 50, "KinhTe": 30}, "roles": {"Student": 70, "Alumni": 10} }
    demographics_breakdown JSONB DEFAULT '{}',

    last_updated TIMESTAMPTZ DEFAULT now()
);

-- 9. AI INSIGHTS (Tổng hợp báo cáo thông minh)
CREATE TABLE public.survey_reports (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES public.surveys(id) ON DELETE CASCADE,
    
    summary_text TEXT,           -- AI tóm tắt tổng quan
    key_findings JSONB,         -- AI liệt kê các điểm chính phát hiện được
    recommendations TEXT,       -- AI gợi ý hành động cho Ban giám hiệu
    
    generated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. CHỈ MỤC TỐI ƯU (INDEXES)
-- Tìm kiếm vector cho AI
CREATE INDEX idx_response_embedding ON public.survey_responses USING hnsw (embedding vector_cosine_ops);
-- Tìm kiếm nhãn AI nhanh
CREATE INDEX idx_response_ai_tags ON public.survey_responses USING GIN (ai_classification);
-- Tìm kiếm thông tin profile nhanh
CREATE INDEX idx_profile_metadata ON public.profile_details USING GIN (metadata);
-- Index để lấy thống kê của một khoa hoặc một lớp cực nhanh
CREATE INDEX idx_survey_stats_lookup ON public.survey_stats (survey_id, segment_type, segment_value);
