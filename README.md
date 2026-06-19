# 🎓 Edu Survey System (Hệ thống Khảo sát & Đóng góp ý kiến cải tiến Giáo dục)

Hệ thống **Edu Survey System** là giải pháp toàn diện hỗ trợ các trường Đại học trong việc khảo sát, thu thập ý kiến đóng góp từ Sinh viên, Giảng viên, Cựu sinh viên và Nhà tuyển dụng. Điểm đặc biệt của hệ thống là việc ứng dụng **Trí tuệ nhân tạo (Generative AI)** để tự động gắn nhãn phân loại phản hồi mở (tích cực/tiêu cực/trung lập, chủ đề góp ý), tự động phân tích và sinh báo cáo xu hướng dựa trên số liệu khảo sát, và quy trình đóng phản hồi khép kín (Closing the Loop) qua luồng giải trình và cải tiến chất lượng giảng dạy.

---

## 🏛️ Kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình **Client - Server** hiện đại với sự tách biệt rõ ràng giữa Frontend và Backend, hỗ trợ xử lý cơ sở dữ liệu quan hệ kết hợp tài liệu phi cấu trúc thông qua Supabase (PostgreSQL) và Trí tuệ nhân tạo thông qua Gemini API.

### Chi tiết các tầng công nghệ:

1. **Frontend (Thư mục `/frontend`)**:
   - Framework: **Next.js 16 (App Router)** & **React 19**.
   - UI/Styling: **Tailwind CSS v4** giúp giao diện hiện đại, responsive mượt mà.
   - Thống kê: **Recharts** vẽ biểu đồ động trực quan hóa kết quả khảo sát.
2. **Backend (Thư mục `/backend`)**:
   - Framework: **FastAPI** (Python 3.10+) hiệu năng cao, tự động sinh tài liệu Swagger.
   - Bảo mật & Giới hạn: JWT Authentication, Password Hashing với `bcrypt`, và Rate Limiting với `slowapi`.
3. **Database & AI (Thư mục `/database` & API ngoài)**:
   - Hệ quản trị CSDL: **PostgreSQL (qua Supabase)**.
   - Dữ liệu đa cấu trúc: Sử dụng kiểu dữ liệu **JSONB** lưu trữ linh hoạt câu hỏi khảo sát và câu trả lời.
   - Mô hình AI: Sử dụng mô hình **Google Gemini (google-genai)** để phân loại bình luận (Sentiment Analysis & Multi-labeling) và tự động tạo báo cáo xu hướng dựa trên số liệu khảo sát thống kê.

---

## 📂 Cấu trúc thư mục dự án

```text
edu-survey-system/
├── backend/                  # Source code Backend (FastAPI)
│   ├── src/
│   │   ├── config/           # Cấu hình môi trường, logging
│   │   ├── core/             # Kết nối Database, bảo mật, limiter
│   │   ├── models/           # Định nghĩa cấu trúc dữ liệu
│   │   ├── repositories/     # Tầng tương tác trực tiếp với Database
│   │   ├── routers/          # Định nghĩa API Endpoints
│   │   ├── schemas/          # Schemas Pydantic (Validation)
│   │   ├── services/         # Business logic & Tích hợp Gemini AI
│   │   └── main.py           # Điểm khởi chạy FastAPI
│   ├── .env.example          # Mẫu cấu hình môi trường backend
│   └── requirements.txt      # Các thư viện Python cần thiết
├── frontend/                 # Source code Frontend (Next.js)
│   ├── src/
│   │   ├── app/              # Routing & Pages (App Router)
│   │   ├── components/       # Các UI Component dùng chung
│   │   └── services/         # Gọi API tới Backend
│   ├── .env.example          # Mẫu cấu hình môi trường frontend
│   └── package.json          # File cấu hình thư viện Node.js
├── database/                 # Cấu trúc CSDL
│   ├── pg.sql                # Các lệnh SQL khởi tạo bảng, quan hệ, chỉ mục
│   ├── pg_function.sql       # Các Stored Procedure/Function phục vụ thống kê
│   └── db_khaosat.png        # Sơ đồ quan hệ thực thể (ERD)
└── docs/                     # Tài liệu hướng dẫn chi tiết
    ├── api.md                # Danh sách endpoints chi tiết của hệ thống
    └── raw_writeframe.md     # Đặc tả giao diện người dùng
```

---

## 🛠️ Hướng dẫn cài đặt dự án

### 📋 Yêu cầu hệ thống trước khi cài đặt:

- **Python** phiên bản >= 3.10
- **Node.js** phiên bản >= 18
- Tài khoản **Supabase** (hoặc một cơ sở dữ liệu PostgreSQL)
- Một API Key từ **Google AI Studio (Gemini API Key)**

---

### Bước 1: Thiết lập Cơ sở dữ liệu (Supabase / Postgres)

1. Đăng nhập vào trang quản trị Supabase của bạn và tạo một project mới.
2. Truy cập vào **SQL Editor** trong Dashboard của Supabase.
3. Sao chép toàn bộ nội dung file [database/pg.sql](file:///f:/edu-survey-system/database/pg.sql) dán vào SQL Editor và nhấn **Run** để khởi tạo các bảng, quan hệ và chỉ mục.
4. Tiếp tục sao chép toàn bộ nội dung file [database/pg_function.sql](file:///f:/edu-survey-system/database/pg_function.sql) dán vào SQL Editor và nhấn **Run** để khởi tạo các Functions hỗ trợ thống kê dữ liệu.

---

### Bước 2: Cài đặt và cấu hình Backend (FastAPI)

1. Di chuyển vào thư mục backend và tạo môi trường ảo Python:
   ```bash
   cd backend
   python -m venv venv
   ```
2. Kích hoạt môi trường ảo:
   - Trên Windows:
     ```powershell
     .\venv\Scripts\activate
     ```
   - Trên macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
3. Cài đặt các thư viện phụ thuộc:
   ```bash
   pip install -r requirements.txt
   ```
4. Cấu hình file môi trường:
   - Tạo file `.env` bằng cách sao chép file `.env.example`:
     ```bash
     cp .env.example .env
     ```
   - Mở file `.env` và điền đầy đủ các thông tin cấu hình:
     - `SUPABASE_URL` & `SUPABASE_KEY`: Lấy trong mục _Project Settings -> API_ của dự án Supabase.
     - `GEMINI_API_KEY`: API Key lấy từ Google AI Studio.
     - Thiết lập các thông số SMTP Mail (nếu sử dụng tính năng gửi email khôi phục mật khẩu).
     - Tạo một chuỗi ngẫu nhiên bảo mật cho `JWT_SECRET`.
5. Khởi chạy Backend Server ở chế độ phát triển:
   ```bash
   python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```
   _Sau khi khởi chạy thành công, bạn có thể xem tài liệu API Swagger tại: [http://localhost:8000/docs](http://localhost:8000/docs)_

---

### Bước 3: Cài đặt và cấu hình Frontend (Next.js)

1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các gói thư viện Node.js:
   ```bash
   npm install
   ```
3. Cấu hình file môi trường:
   - Tạo file `.env.local` từ `.env.example`:
     ```bash
     cp .env.example .env.local
     ```
   - Đảm bảo cấu hình đúng đường dẫn API của Backend:
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:8000
     ```
4. Khởi chạy ứng dụng Frontend:
   ```bash
   npm run dev
   ```
   _Mở trình duyệt truy cập vào địa chỉ [http://localhost:3000](http://localhost:3000) để bắt đầu trải nghiệm ứng dụng._

---

## 🌟 Các chức năng và Quy trình nghiệp vụ chính

### 1. Phân quyền người dùng (6 Vai trò cốt lõi)

- **ADMIN**: Quản lý tài khoản, trạng thái khóa/mở tài khoản, quản lý danh mục cơ sở (Khoa, Ngành, Lớp, Môn học, Tên miền email hợp lệ) và xem nhật ký hệ thống (`system_logs`).
- **MANAGER (Cán bộ QA)**: Thiết kế khảo sát linh hoạt dạng JSON (Survey Builder), cấu hình đối tượng làm bài, duyệt giải trình của giảng viên, kiểm duyệt các thông điệp giảng viên gửi tới sinh viên, xuất báo cáo PDF/Excel.
- **LECTURER**: Xem thống kê các đánh giá của sinh viên về môn học mình giảng dạy (đã ẩn danh), tiếp nhận yêu cầu giải trình nếu điểm đánh giá quá thấp, gửi giải trình tới Manager và viết thông điệp gửi tới sinh viên.
- **STUDENT, ALUMNI, EMPLOYER**: Thực hiện làm khảo sát. Sinh viên/Cựu sinh viên đăng nhập qua tài khoản trường, Nhà tuyển dụng truy cập qua đường dẫn đặc thù xác thực bằng OTP gửi tới Email.

### 2. Quy trình "Đóng phản hồi" (Closing the Loop)

Hệ thống giải quyết triệt để vấn đề khảo sát hình thức bằng quy trình khép kín sau:

```
[Kết quả khảo sát kém] ──> [Manager yêu cầu giải trình] ──> [Lecturer gửi biên bản giải trình & cam kết]
                                                                        │
[Sinh viên xem phản hồi cải tiến] <── [Manager duyệt thông điệp] <──────┘
```

### 3. Phân tích thông minh bằng AI (Gemini AI)

- **Tự động gắn nhãn (Auto-labeling)**: Tự động phân loại các phản hồi tự do thành các chủ đề (Cơ sở vật chất, Tài liệu, Phương pháp dạy, Thái độ...) và gắn nhãn cảm xúc (Tích cực/Tiêu cực/Trung lập).
- **Phân tích báo cáo xu hướng (Trend Report Generation)**: Tự động tổng hợp dữ liệu số liệu khảo sát định lượng kết hợp với các nhãn định tính đã gán để sinh báo cáo tóm tắt, phát hiện các điểm nổi bật và đề xuất cải tiến cho ban quản lý.
