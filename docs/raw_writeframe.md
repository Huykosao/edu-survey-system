## RAW WRITE FRAME - MÔ TẢ CHI TIẾT GIAO DIỆN NGƯỜI DÙNG
> Các thành phần được mô tả trong write frame có thể thay đổi trong quá trình phát triển để phù hợp với nhu cầu thực tế tuy nhiên cần phải dựa vào bộ khung này để đảm bảo đầy đủ chức năng chính của hệ thống.

### PHẦN 1: HỆ THỐNG XÁC THỰC & TÀI KHOẢN (Chung)

**Màn hình A1: Đăng nhập (Login)**
*   Trung tâm: Logo Trường + Tiêu đề hệ thống.
*   Form: [Tên đăng nhập], [Mật khẩu], [Nút: Đăng nhập].
*   Dưới Form: Nút [Quên mật khẩu?].

**Màn hình A2: Đổi mật khẩu lần đầu (Force Change Password)**
*   Mô tả: "Đây là lần đầu bạn đăng nhập. Để bảo mật, vui lòng đổi mật khẩu mới."
*   Form: [Mật khẩu hiện tại], [Mật khẩu mới], [Xác nhận mật khẩu mới].
*   Nút: [Cập nhật mật khẩu].

**Màn hình A3: Hồ sơ cá nhân (Profile Details)**
*   Bố cục: Chia làm 2 cột (Trái: Avatar + Thông tin cơ bản; Phải: Form chi tiết).
*   Thông tin cơ bản: Tên, Role, Email, Mã số (SV/GV).
*   Thông tin mở rộng (Sửa được): Số điện thoại, Địa chỉ liên hệ.
*   Thông tin đặc thù:
    *   (SV): Lớp, Ngành, Khoa.
    *   (Alumni): Năm tốt nghiệp, Công ty hiện tại, Vị trí.
    *   (Employer): Tên doanh nghiệp, Lĩnh vực hoạt động, Website.
*   Nút: [Lưu thay đổi].

**Màn hình A4: Trung tâm Thông báo (Notification Center)**
*   Danh sách dạng Timeline: [Icon loại thông báo] - [Tiêu đề] - [Nội dung tóm tắt] - [Thời gian].
*   Phân loại (Tabs): Tất cả - Chưa đọc - Đã đọc.
*   Hành động: [Đánh dấu tất cả đã đọc], [Xóa thông báo].

---

### PHẦN 2: MODULE QUẢN TRỊ VIÊN (System Admin)

**Màn hình B1: Quản lý Người dùng (User Management)**
*   Bộ lọc: Role, Khoa, Trạng thái tài khoản.
*   Nút: [Thêm người dùng mới], [Import từ Excel].
*   Bảng: [ID] - [Họ tên] - [Role] - [Email] - [Ngày tạo] - [Hành động: Khóa/Mở/Reset PW].

**Màn hình B2: Quản lý Danh mục Cơ sở (Core Categories)**
*   Tab 1 (Khoa/Ngành): Danh sách Khoa -> Click vào xem danh sách Ngành thuộc khoa.
*   Tab 2 (Lớp): Danh sách lớp kèm niên khóa.
*   Tab 3 (Môn học): [Mã môn] - [Tên môn] - [Khoa quản lý].

**Màn hình B3: Nhật ký Hệ thống (Security Logs)**
*   Bộ lọc: Theo thời gian, Theo User, Theo hành động (Sửa/Xóa/Login).
*   Bảng: [Thời gian] - [User] - [Hành động] - [Mô tả chi tiết JSON] - [IP Address].

---

### PHẦN 3: MODULE CÁN BỘ QUẢN LÝ (Manager - QA)

**Màn hình C1: Dashboard Tổng hợp (Analytics)**
*   Hàng trên: 4 Widget số liệu (Tổng khảo sát, Tỷ lệ phản hồi, Số giải trình đang chờ, Số phản hồi tiêu cực cần xử lý).
*   Giữa: Biểu đồ đường (Tỷ lệ phản hồi theo thời gian) & Biểu đồ cột (Điểm trung bình theo Khoa).
*   Dưới: Top 5 môn học có đánh giá cao nhất/thấp nhất (Dữ liệu từ AI).

**Màn hình C2: Quản lý & Thiết kế Khảo sát (Survey Builder)**
*   Header: [Tên khảo sát], [Chọn Loại: Sinh viên/GV/DN/Cựu SV].
*   Vùng thiết kế:
    *   Thêm Section (Phần).
    *   Thêm câu hỏi (Trắc nghiệm 1-5, Có/Không, Chọn nhiều, Trả lời tự do).
*   Nút: [Cài đặt Target] (Chọn Khoa/Lớp/Môn học cụ thể được làm bài này).

**Màn hình C3: Trung tâm Điều phối Giải trình**
*   Danh sách: [Tên Giảng viên] - [Môn học] - [Lý do yêu cầu giải trình] - [Deadline] - [Trạng thái].
*   Popup Chi tiết: Xem lại dữ liệu khảo sát bị chê -> Gửi yêu cầu giải trình chính thức cho GV.

**Màn hình C4: Phê duyệt Phản hồi Giảng viên**
*   Danh sách: Các lời nhắn GV muốn gửi sinh viên.
*   Giao diện So sánh: [Nội dung GV viết] <-> [Nút: Chỉnh sửa/Duyệt/Từ chối].

**Màn hình C5: Báo cáo & Xuất dữ liệu**
*   Bộ lọc bài khảo sát.
*   Xem Dashboard chi tiết của bài đó.
*   Nút: [Xuất báo cáo PDF], [Xuất dữ liệu thô Excel].

---

### PHẦN 4: MODULE GIẢNG VIÊN (Lecturer)

**Màn hình D1: Dashboard Giảng viên**
*   Danh sách: "Môn học bạn đang phụ trách kỳ này".
*   Thống kê nhanh: Điểm đánh giá trung bình từ sinh viên qua các kỳ.

**Màn hình D2: Chi tiết Đánh giá Môn học**
*   Báo cáo ẩn danh: [Điểm từng tiêu chí] - [Biểu đồ phân bổ đánh giá].
*   Vùng góp ý từ sinh viên: Danh sách các câu trả lời tự do (Có gắn nhãn AI: Tích cực/Tiêu cực/Gợi ý).

**Màn hình D3: Cổng Phản hồi & Giải trình**
*   Tab 1 (Giải trình): Form nhập nội dung giải trình với Ban quản lý về kết quả thấp.
*   Tab 2 (Phản hồi SV): Ô nhập tin nhắn gửi tới lớp học (Ví dụ: "Thầy đã ghi nhận việc thiếu tài liệu và sẽ bổ sung vào tuần tới...").

---

### PHẦN 5: MODULE ĐỐI TƯỢNG KHẢO SÁT (Student, Alumni, Employer)

**Màn hình E1: Danh sách việc cần làm**
*   Danh sách khảo sát chưa làm (Nổi bật, có Deadline).
*   Danh sách khảo sát đã hoàn thành.

**Màn hình E2: Màn hình Làm bài Khảo sát**
*   Thanh tiến trình phía trên.
*   Nội dung: Câu hỏi hiện ra từng trang hoặc cuộn dọc.
*   Nút: [Lưu nháp], [Hoàn thành].

**Màn hình E3: Bảng tin Cải tiến (Closing the Loop)**
*   Danh sách bài viết: [Ảnh minh họa] - [Tiêu đề: Nhà trường đã làm gì sau khảo sát X] - [Ngày đăng].
*   Chi tiết bài viết: "Dựa trên ý kiến của 80% sinh viên, nhà trường đã nâng cấp Wifi thư viện..."

---

### PHẦN 6: TRANG LỖI & PHỤ

**Màn hình F1: Trang 403 (Không có quyền truy cập)**
*   Nội dung: "Bạn không có quyền xem trang này. Vui lòng liên hệ Admin nếu đây là lỗi."
*   Nút: [Quay lại trang chủ].

**Màn hình F2: Trang Hoàn thành khảo sát**
*   Nội dung: "Cảm ơn bạn đã đóng góp ý kiến giúp cải thiện chất lượng giáo dục!"
*   Nút: [Xem các thông báo cải tiến khác].
