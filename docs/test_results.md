# 🧪 Kết Quả Kiểm Thử Hệ Thống (Test Cases & Results)

Hồ sơ kiểm thử chi tiết cho các hạng mục đã hoàn thiện trong đợt tối ưu hóa và sửa lỗi hệ thống khảo sát **EduSurvey**.

---

## 1. 🛡️ Bảo Mật & Xác Thực (Security & Authentication)

### Test Case 1.1: Chống Brute-Force Đăng Nhập
* **Mô tả:** Gửi liên tiếp các yêu cầu đăng nhập (POST `/auth/login`) sai thông tin hoặc đúng thông tin từ một địa chỉ IP.
* **Các bước thực hiện:**
  1. Gửi liên tục 12 yêu cầu đăng nhập trong vòng 1 phút qua Postman/cURL hoặc bấm nút Đăng nhập liên tục.
* **Kết quả mong muốn:**
  * 10 yêu cầu đầu tiên xử lý bình thường.
  * Từ yêu cầu thứ 11 trở đi, hệ thống phản hồi HTTP Status `429 Too Many Requests` và trả về thông báo lỗi thân thiện: *"Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau..."*
* **Kết quả thực tế:** **PASSED** (SlowAPI chặn chính xác và trả về thông báo tùy biến tiếng Việt).

### Test Case 1.2: Chống Spam Đặt Lại Mật Khẩu (Forgot Password)
* **Mô tả:** Gửi liên tục yêu cầu cấp mật khẩu mới (POST `/auth/forgot-password`) để tránh spam email.
* **Các bước thực hiện:**
  1. Nhập email và bấm "Nhận mật khẩu mới" 4 lần liên tiếp trong vòng 1 phút.
* **Kết quả mong muốn:**
  * 3 yêu cầu đầu tiên gửi thành công.
  * Yêu cầu thứ 4 bị chặn bởi middleware giới hạn tần suất, trả về HTTP Status `429` với thông báo thời gian chờ cụ thể.
* **Kết quả thực tế:** **PASSED**.

### Test Case 1.3: Chống Tự Xóa Tài Khoản Admin
* **Mô tả:** Đảm bảo Admin đang đăng nhập không thể tự xóa tài khoản của chính mình qua endpoint `DELETE /api/users/{user_id}`.
* **Các bước thực hiện:**
  1. Đăng nhập tài khoản Admin (ID: 1).
  2. Gửi request `DELETE /api/users/1`.
* **Kết quả mong muốn:**
  * API trả về HTTP Status `400 Bad Request`.
  * Nội dung phản hồi: `{"detail": "Không thể xóa chính tài khoản của bạn"}`.
* **Kết quả thực tế:** **PASSED**.

---

## 2. 🗄️ Tối Ưu Hóa Hiệu Năng (Performance Optimization)

### Test Case 2.1: Tối Ưu N+1 Query Xác Thực (Middleware)
* **Mô tả:** Kiểm tra số lượng truy vấn cơ sở dữ liệu trên mỗi HTTP request cần xác thực.
* **Các bước thực hiện:**
  1. Thực hiện các API request cần quyền Admin/User (ví dụ: `GET /api/profile`).
  2. Xem logs truy vấn của hệ thống.
* **Kết quả mong muốn:**
  * Hệ thống chỉ thực hiện **1 truy vấn** vào bảng `users` để lấy thông tin tài khoản và kiểm tra trạng thái hoạt động.
  * Quyền hạn (roles) được giải mã trực tiếp từ JWT payload, không gọi truy vấn phụ vào bảng `user_roles` và `roles`.
* **Kết quả thực tế:** **PASSED** (Giảm 50% số lượng truy vấn DB trên mỗi request có auth).

### Test Case 2.2: Tối Ưu Dashboard Overview Query
* **Mô tả:** Kiểm tra hiệu năng tải trang tổng quan Dashboard.
* **Các bước thực hiện:**
  1. Gọi endpoint `GET /api/dashboard/overview`.
  2. Kiểm tra log truy vấn DB.
* **Kết quả mong muốn:**
  * Thay vì thực hiện 3 lệnh đếm độc lập trên các bảng `users`, `surveys`, `survey_responses`, hệ thống chỉ gọi duy nhất 1 RPC database function `get_dashboard_counts()`.
* **Kết quả thực tế:** **PASSED** (Thời gian phản hồi API giảm đáng kể, giảm tải cho connection pool).

---

## 3. 📝 Kiểm Soát Lỗi Dữ Liệu (Data Integrity Validation)

### Test Case 3.1: Xác Thực Khoa (`faculty_id`) Khi Tạo Người Dùng
* **Mô tả:** Đảm bảo không thể gán một khoa không tồn tại cho người dùng mới.
* **Các bước thực hiện:**
  1. Gửi yêu cầu tạo người dùng mới với `faculty_id = 9999` (ID không tồn tại).
* **Kết quả mong muốn:**
  * Hệ thống phát hiện sớm và chặn yêu cầu, trả về HTTP Status `400 Bad Request`.
  * Thông báo phản hồi: `"Khoa có ID 9999 không tồn tại"`.
* **Kết quả thực tế:** **PASSED** (Đã chặn ở mức Router trước khi ghi vào Database).

### Test Case 3.2: Xác Thực Khoa Khi Cập Nhật Thông Tin/Profile
* **Mô tả:** Đảm bảo tính nhất quán của dữ liệu khi cập nhật chi tiết profile cá nhân.
* **Các bước thực hiện:**
  1. Gửi yêu cầu cập nhật thông tin user hoặc profile details với `faculty_id` không hợp lệ.
* **Kết quả mong muốn:**
  * API từ chối cập nhật và trả về mã lỗi `400` cùng thông báo lỗi tương tự.
* **Kết quả thực tế:** **PASSED**.

---

## 4. 🎨 Trải Nghiệm Người Dùng (Frontend UX)

### Test Case 4.1: Hiển Thị Lỗi Đăng Ký Trực Quan
* **Mô tả:** Đảm bảo lỗi do backend trả về được hiển thị trực tiếp cho quản trị viên khi tạo tài khoản.
* **Các bước thực hiện:**
  1. Mở modal thêm người dùng mới.
  2. Nhập email đã tồn tại trong hệ thống.
  3. Bấm "Tạo người dùng".
* **Kết quả mong muốn:**
  * Modal không tự động đóng.
  * Hộp cảnh báo màu đỏ xuất hiện phía trên form hiển thị thông báo lỗi chi tiết từ backend gửi về: *"Email hoặc tài khoản đã tồn tại"*.
* **Kết quả thực tế:** **PASSED**.

### Test Case 4.2: Trạng Thái Loading & Khóa Nút Bấm (Spam Prevention)
* **Mô tả:** Tránh việc người dùng nhấn đúp/gửi nhiều request trùng lặp khi mạng chậm.
* **Các bước thực hiện:**
  1. Bấm nút "Tạo người dùng" (hoặc "Lưu thay đổi" ở trang edit).
* **Kết quả mong muốn:**
  * Nút bấm ngay lập tức chuyển sang trạng thái disabled (mờ đi).
  * Biểu tượng spinner xoay tròn xuất hiện kèm chữ *"Đang tạo..."* hoặc *"Đang lưu..."*.
* **Kết quả thực tế:** **PASSED**.

### Test Case 4.3: Liên Kết Quay Lại Đăng Nhập
* **Mô tả:** Giao diện liên kết quay lại trang đăng nhập ở trang Quên mật khẩu.
* **Các bước thực hiện:**
  1. Di chuột vào dòng chữ "Quay lại đăng nhập".
* **Kết quả mong muốn:**
  * Chỉ có dòng chữ "Quay lại đăng nhập" được gạch chân.
  * Icon mũi tên và khoảng cách giữa icon với chữ không bị gạch chân. Icon mũi tên nhỏ gọn và tinh tế (`12px`).
* **Kết quả thực tế:** **PASSED**.
