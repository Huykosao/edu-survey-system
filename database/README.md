## Cơ sở dữ liệu: 
### 1. Đặt vấn đề
- Hệ thống cần một cơ sở dữ liệu quan hệ để lưu trữ thông tin người dùng, khóa, ngành, lớp và các thông tin cơ bản khác đồng thời cũng cần lưu trữ thông tin đa cấu trúc như các bài khảo sát, lịch sử trả lời của người dùng, các câu hỏi và câu trả lời của bài khảo sát nên cần phải tìm một giải pháp phù hợp cho cả hai loại dữ liệu này.

### 2. Giải pháp
Kết hợp cả hai loại cơ sở dữ liệu quan hệ và NoSQL để tận dụng ưu điểm của từng loại:
- Sử dụng một cơ sở dữ liệu quan hệ như MySQL hoặc PostgreSQL để lưu trữ thông tin người dùng, khóa, ngành, lớp và các thông tin cơ bản khác. Điều này sẽ giúp đảm bảo tính toàn vẹn dữ liệu và dễ dàng truy vấn.
- Sử dụng một cơ sở dữ liệu NoSQL như MongoDB để lưu trữ thông tin đa cấu trúc như các bài khảo sát, lịch sử trả lời của người dùng, các câu hỏi và câu trả lời của bài khảo sát. Điều này sẽ giúp linh hoạt hơn trong việc lưu trữ dữ liệu có cấu trúc phức tạp và dễ dàng mở rộng khi cần thiết.

### 3. Lựa chọn công nghệ
- Dùng PostgreSQL cho cơ sở dữ liệu quan hệ để lưu trữ thông tin người dùng, khóa, ngành, lớp và các thông tin cơ bản khác.
- Dùng Postgre JSONB cho cơ sở dữ liệu NoSQL để lưu trữ thông tin đa cấu trúc như các bài khảo sát, lịch sử trả lời của người dùng, các câu hỏi và câu trả lời của bài khảo sát.