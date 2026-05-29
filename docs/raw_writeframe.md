# RAW WRITE-FRAME: BẢN MÔ TẢ GIAO DIỆN CHI TIẾT
Dưới đây là bản mô tả chi tiết về giao diện người dùng.
### 1. Bố cục chung (Layout Tổng thể)
*   **Thanh điều hướng bên trái (Sidebar):** Logo Trường, Danh sách Menu chức năng (thay đổi theo Role), Thông tin phiên bản.
*   **Thanh tiêu đề (Header):** Tên trang hiện tại, Nút thông báo (Bell icon với số lượng chưa đọc), Hồ sơ cá nhân (Avatar, Tên, Role), Nút đăng xuất.
*   **Vùng nội dung (Main Content):** Hiển thị dữ liệu chính của từng chức năng.

---

### 2. Giao diện QUẢN TRỊ VIÊN (System Admin)
**Màn hình 1: Quản lý Người dùng**
*   Bộ lọc: Theo Role (6 loại), Theo Khoa, Trạng thái (Active/Locked).
*   Bảng danh sách: [Mã định danh] - [Họ tên] - [Email] - [Quyền] - [Trạng thái].
*   Nút chức năng: Thêm mới (Cấp tài khoản), Reset mật khẩu, Khóa tài khoản, Xuất Excel danh sách.

**Màn hình 2: Quản lý Danh mục Gốc**
*   Tab 1: Khoa/Ngành/Lớp (Thêm/Sửa/Xóa).
*   Tab 2: Môn học (Mã môn, Tên môn, Khoa quản lý).

**Màn hình 3: Nhật ký Hệ thống**
*   Danh sách: [Thời gian] - [Người dùng] - [Hành động] - [IP] - [Chi tiết thay đổi].

---

### 3. Giao diện CÁN BỘ QUẢN LÝ (Manager - QA)
**Màn hình 1: Dashboard Thống kê (Hỗ trợ ra quyết định)**
*   Biểu đồ cột: Tỷ lệ hoàn thành khảo sát theo từng đối tượng.
*   Biểu đồ tròn: Phân bổ đánh giá (Tốt/Khá/Trung bình/Kém) toàn trường.
*   Widget AI: "Tóm tắt nhanh 5 vấn đề nóng nhất cần giải quyết ngay".

**Màn hình 2: Quản lý Khảo sát**
*   Nút: Tạo khảo sát mới (Thiết kế câu hỏi kéo thả).
*   Cài đặt: Chọn đối tượng mục tiêu (Ví dụ: Chỉ sinh viên năm 4 khoa CNTT).
*   Trạng thái: Bản nháp / Đang mở / Đã đóng.

**Màn hình 3: Trung tâm Giải trình & Phê duyệt**
*   Danh sách giảng viên cần giải trình (Dựa trên điểm khảo sát thấp).
*   Chi tiết: Nội dung giảng viên viết -> [Nút Duyệt] hoặc [Nút Yêu cầu viết lại].
*   Duyệt phản hồi: Nội dung giảng viên định nhắn cho sinh viên -> [Chỉnh sửa/Phê duyệt].

**Màn hình 4: Thông báo Cải tiến (Closing the Loop)**
*   Soạn thảo tin tức: "Kết quả khảo sát tháng 10: Nhà trường đã lắp thêm 20 máy lạnh tại khu C theo yêu cầu của sinh viên".

---

### 4. Giao diện GIẢNG VIÊN (Teacher)
**Màn hình 1: Dashboard Cá nhân**
*   Danh sách các lớp/môn học đang giảng dạy.
*   Nút: [Xem kết quả đánh giá] cho từng môn.

**Màn hình 2: Kết quả Khảo sát (Ẩn danh)**
*   Biểu đồ điểm trung bình từng tiêu chí (Chuyên môn, Nhiệt tình, Tài liệu...).
*   Danh sách góp ý tự do (Text): AI đã phân loại (Tích cực/Tiêu cực).
*   Nút: Xuất báo cáo PDF cá nhân.

**Màn hình 3: Cổng Giải trình**
*   Thông báo: "Bạn có 01 yêu cầu giải trình cho môn X".
*   Ô nhập liệu: [Lý do khách quan/chủ quan] - [Cam kết cải thiện].
*   Ô nhắn gửi sinh viên: "Cảm ơn các em đã góp ý, thầy sẽ điều chỉnh tốc độ giảng dạy..." (Gửi đi để Manager duyệt).

---

### 5. Giao diện SINH VIÊN / CỰU SINH VIÊN
**Màn hình 1: Danh sách Khảo sát**
*   Khảo sát đang mở: [Tên bài] - [Thời hạn] - [Nút: Làm bài].
*   Khảo sát đã hoàn thành (Lưu lịch sử).

**Màn hình 2: Giao diện Làm bài (Responsive)**
*   Thanh tiến trình (Ví dụ: 35%).
*   Câu hỏi trắc nghiệm (Chọn mức độ 1-5).
*   Ô góp ý tự do (Gợi ý: "Hãy chia sẻ thẳng thắn, chúng tôi bảo mật danh tính của bạn").

**Màn hình 3: Bảng tin Cải tiến**
*   Hiển thị các bài đăng từ Manager về việc nhà trường đã thay đổi thế nào sau các kỳ khảo sát trước.

---

### 6. Giao diện NHÀ TUYỂN DỤNG (Employer)
**Màn hình 1: Đăng nhập (Admin cấp)**
*   Ô nhập Username/Password do trường gửi qua Email.

**Màn hình 2: Đánh giá Chất lượng Đào tạo**
*   Danh sách tiêu chí năng lực (Kiến thức nghề, Thái độ, Kỹ năng mềm).
*   Ô nhập dự báo: "Trong 2 năm tới, chúng tôi cần nhân sự biết về [AI/Big Data]..."
*   Nút: Gửi đánh giá cho Nhà trường.

---

### 7. Giao diện THÔNG BÁO (Chung cho tất cả)
*   Danh sách Notification:
    *   "Bạn có khảo sát mới cần thực hiện." (Student/Alumni/Lecturer)
    *   "Giải trình của bạn đã được phê duyệt." (Lecturer)
    *   "Có 10 phản hồi tiêu cực mới cần xử lý." (Manager)
    *   "Nhà trường đã phản hồi về góp ý của bạn." (Student)
