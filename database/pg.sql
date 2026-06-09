-- ==========================================
-- 1. KÍCH HOẠT TIỆN ÍCH AI
-- ==========================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- 2. ĐỊNH NGHĨA CÁC LOẠI TRẠNG THÁI (ENUMS)
-- ==========================================
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'locked');
CREATE TYPE public.survey_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE public.clarification_status AS ENUM ('pending', 'submitted', 'approved', 'rejected', 'disputed');

-- ==========================================
-- 3. HỆ THỐNG PHÂN QUYỀN & NGƯỜI DÙNG
-- ==========================================
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, 
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Chèn 6 Role theo đúng yêu cầu
INSERT INTO public.roles (name, description) VALUES
('ADMIN', 'Kỹ thuật viên quản lý vận hành, tài khoản và phân quyền'),
('MANAGER', 'Cán bộ quản lý (QA), thiết kế khảo sát, điều phối giải trình và báo cáo'),
('LECTURER', 'Giảng viên'),
('STUDENT', 'Sinh viên'),
('ALUMNI', 'Cựu sinh viên'),
('EMPLOYER', 'Nhà tuyển dụng');

CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL, -- Mã định danh hoặc Username được cấp
    password_hash TEXT NOT NULL,           
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    status public.user_status DEFAULT 'active',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_roles (
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    role_id INT REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Nhật ký giám sát (Dành cho ADMIN quản lý hệ thống)
CREATE TABLE public.system_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(id),
    action VARCHAR(255), -- Ví dụ: 'LOGIN', 'CREATE_USER', 'DELETE_SURVEY'
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 4. DANH MỤC DÙNG CHUNG (Admin quản lý nền)
-- ==========================================
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
    major_id INT REFERENCES public.majors(id) ON DELETE CASCADE
);

CREATE TABLE public.subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    faculty_id INT REFERENCES public.faculties(id) ON DELETE CASCADE
);

CREATE TABLE public.profile_details (
    user_id INT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    faculty_id INT REFERENCES public.faculties(id),
    major_id INT REFERENCES public.majors(id),
    class_id INT REFERENCES public.classes(id),
    
    student_code VARCHAR(50), 
    lecturer_code VARCHAR(50), 
    
    -- Thông tin cho Cựu SV và Doanh nghiệp
    is_alumni BOOLEAN DEFAULT FALSE,
    graduation_year INT,
    company_name VARCHAR(255), -- Tên doanh nghiệp (Dành cho Role EMPLOYER)
    position VARCHAR(100),     -- Chức vụ
    
    metadata JSONB DEFAULT '{}' 
);

-- ==========================================
-- 5. QUẢN LÝ KHẢO SÁT (Do MANAGER điều phối)
-- ==========================================
CREATE TABLE public.surveys (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL, -- Cấu trúc Sections -> Questions
    status public.survey_status DEFAULT 'draft',
    is_anonymous BOOLEAN DEFAULT TRUE,
    
    target_config JSONB DEFAULT '{}', -- Quy định đối tượng được làm (Role, Faculty, Subject...)
    
    created_by INT REFERENCES public.users(id), -- Manager tạo
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.survey_responses (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES public.surveys(id) ON DELETE CASCADE,
    user_id INT REFERENCES public.users(id), -- Tất cả người dùng kể cả DN đều có UserID
    subject_id INT REFERENCES public.subjects(id), -- Khảo sát này cho môn học nào (nếu có)
    
    answers JSONB NOT NULL, 
    raw_content_text TEXT, 
    embedding vector(1536), 
    ai_classification JSONB DEFAULT '{}', 
    
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 6. THỐNG KÊ & BÁO CÁO AI (Hỗ trợ ra quyết định)
-- ==========================================
CREATE TABLE public.survey_stats (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES public.surveys(id) ON DELETE CASCADE,
    segment_type VARCHAR(50), -- 'FACULTY', 'SUBJECT', 'OVERALL'
    segment_value VARCHAR(100), 
    total_responses INT DEFAULT 0,
    question_analysis JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.survey_reports (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES public.surveys(id) ON DELETE CASCADE,
    summary_text TEXT,           
    key_findings JSONB,         
    recommendations TEXT,       -- AI gợi ý hướng cải tiến
    generated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 7. ĐIỀU PHỐI GIẢI TRÌNH & PHẢN HỒI (MANAGER <-> LECTURER)
-- ==========================================
CREATE TABLE public.survey_clarifications (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES public.surveys(id) ON DELETE CASCADE,
    lecturer_id INT REFERENCES public.users(id) ON DELETE CASCADE, 
    requested_by INT REFERENCES public.users(id), -- Manager gán Task
    
    request_reason TEXT NOT NULL,
    deadline TIMESTAMPTZ,                                          
    
    explanation_content TEXT,                                      
    commitment_text TEXT,                                          
    is_disputed BOOLEAN DEFAULT FALSE,                             
    
    status public.clarification_status DEFAULT 'pending',
    admin_comment TEXT, -- Manager nhận xét giải trình
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phản hồi của giảng viên gửi sinh viên (Cần Manager duyệt)
CREATE TABLE public.lecturer_responses_to_students (
    id SERIAL PRIMARY KEY,
    clarification_id INT REFERENCES public.survey_clarifications(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL, 
    is_published BOOLEAN DEFAULT FALSE, -- Manager phê duyệt mới được hiển thị cho SV
    approved_by INT REFERENCES public.users(id), -- Manager thực hiện duyệt
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 8. THÔNG BÁO CẢI TIẾN (Closing The Loop)
-- ==========================================
-- Manager đăng thông báo về những gì trường đã cải thiện sau khảo sát
CREATE TABLE public.improvement_announcements (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES public.surveys(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT,
    target_roles JSONB, -- [STUDENT, ALUMNI, EMPLOYER]
    created_by INT REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 9. HỆ THỐNG THÔNG BÁO (NOTIFICATION)
-- ==========================================
CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INT REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50), 
    title VARCHAR(255),
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1. Tạo bảng lưu trữ danh sách tên miền email được phép
CREATE TABLE public.allowed_domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Chèn dữ liệu mẫu
INSERT INTO public.allowed_domains (domain, description) VALUES
('example.com', 'Tên miền thử nghiệm'),
('mycompany.com', 'Tên miền công ty'),
('edu.vn', 'Tên miền giáo dục chung'),
('student.edu.vn', 'Tên miền sinh viên');

CREATE TABLE public.student_response_class (
    id SERIAL PRIMARY KEY,
    label_name VARCHAR(255) UNIQUE NOT NULL,
    label_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
)

CREATE TABLE public.teacher_response_class (
    id SERIAL PRIMARY KEY,
    label_name VARCHAR(255) UNIQUE NOT NULL,
    label_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
)

CREATE TABLE public.employer_response_class (
    id SERIAL PRIMARY KEY,
    label_name VARCHAR(255) UNIQUE NOT NULL,
    label_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
)


-- ==========================================
-- 10. CHỈ MỤC TỐI ƯU (INDEXES)
-- ==========================================
CREATE INDEX idx_vector_search ON public.survey_responses USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_survey_stats_fast ON public.survey_stats (survey_id, segment_type, segment_value);
CREATE INDEX idx_clarification_lecturer ON public.survey_clarifications (lecturer_id, status);
CREATE INDEX idx_subject_faculty ON public.subjects (faculty_id);