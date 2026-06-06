# 1. Authentication Module

## 1.1 Đăng nhập / Đăng xuất

| Method | Endpoint                    | Mô tả                       |
| ------ | --------------------------- | --------------------------- |
| POST   | `/api/auth/login`           | Đăng nhập                   |
| POST   | `/api/auth/logout`          | Đăng xuất                   |
| POST   | `/api/auth/refresh-token`   | Cấp lại access token        |
| GET    | `/api/auth/me`              | Lấy thông tin user hiện tại |
| PUT    | `/api/auth/change-password` | Đổi mật khẩu                |

---

# 2. User & Role Management Module (ADMIN)

## 2.1 Quản lý người dùng

| Method | Endpoint                 |
| ------ | ------------------------ |
| GET    | `/api/users`             |
| GET    | `/api/users/{id}`        |
| POST   | `/api/users`             |
| PUT    | `/api/users/{id}`        |
| DELETE | `/api/users/{id}`        |
| PATCH  | `/api/users/{id}/status` |

### Chức năng

- Tạo tài khoản
- Khóa tài khoản
- Mở khóa tài khoản
- Cập nhật thông tin

---

## 2.2 Phân quyền

| Method | Endpoint                |
| ------ | ----------------------- |
| GET    | `/api/roles`            |
| GET    | `/api/users/{id}/roles` |
| PUT    | `/api/users/{id}/roles` |

---

# 3. Master Data Module (ADMIN)

## 3.1 Khoa

| Method | Endpoint              |
| ------ | --------------------- |
| GET    | `/api/faculties`      |
| POST   | `/api/faculties`      |
| PUT    | `/api/faculties/{id}` |
| DELETE | `/api/faculties/{id}` |

---

## 3.2 Ngành

| Method | Endpoint           |
| ------ | ------------------ |
| GET    | `/api/majors`      |
| POST   | `/api/majors`      |
| PUT    | `/api/majors/{id}` |
| DELETE | `/api/majors/{id}` |

---

## 3.3 Lớp

| Method | Endpoint            |
| ------ | ------------------- |
| GET    | `/api/classes`      |
| POST   | `/api/classes`      |
| PUT    | `/api/classes/{id}` |
| DELETE | `/api/classes/{id}` |

---

## 3.4 Môn học

| Method | Endpoint             |
| ------ | -------------------- |
| GET    | `/api/subjects`      |
| POST   | `/api/subjects`      |
| PUT    | `/api/subjects/{id}` |
| DELETE | `/api/subjects/{id}` |

---

# 4. Profile Module

Phục vụ Student, Lecturer, Alumni, Employer.

| Method | Endpoint               |
| ------ | ---------------------- |
| GET    | `/api/profile`         |
| PUT    | `/api/profile`         |
| GET    | `/api/profile/details` |
| PUT    | `/api/profile/details` |

---

# 5. Survey Management Module (MANAGER)

Đây là module quan trọng nhất.

## 5.1 Tạo khảo sát

| Method | Endpoint            |
| ------ | ------------------- |
| POST   | `/api/surveys`      |
| PUT    | `/api/surveys/{id}` |
| DELETE | `/api/surveys/{id}` |
| GET    | `/api/surveys/{id}` |
| GET    | `/api/surveys`      |

---

## 5.2 Publish khảo sát

| Method | Endpoint                      |
| ------ | ----------------------------- |
| POST   | `/api/surveys/{id}/publish`   |
| POST   | `/api/surveys/{id}/close`     |
| POST   | `/api/surveys/{id}/duplicate` |

---

## 5.3 Danh sách khảo sát theo đối tượng

### Student

```http
GET /api/my-surveys
```

### Lecturer

```http
GET /api/my-surveys
```

### Alumni

```http
GET /api/my-surveys
```

### Employer

```http
GET /api/my-surveys
```

Backend lọc theo:

```json
target_config
```

---

# 6. Survey Response Module

## 6.1 Trả lời khảo sát

| Method | Endpoint                      |
| ------ | ----------------------------- |
| POST   | `/api/surveys/{id}/responses` |

---

## 6.2 Kiểm tra đã làm chưa

| Method | Endpoint                        |
| ------ | ------------------------------- |
| GET    | `/api/surveys/{id}/my-response` |

---

## 6.3 Xem phản hồi

| Method | Endpoint                      |
| ------ | ----------------------------- |
| GET    | `/api/surveys/{id}/responses` |

Quyền:

- Manager
- Admin

---

## 6.4 Chi tiết phản hồi

| Method | Endpoint              |
| ------ | --------------------- |
| GET    | `/api/responses/{id}` |

---

# 7. AI Analysis Module

Dựa trên:

```sql
embedding vector(1536)
ai_classification jsonb
```

---

## 7.1 AI phân loại phản hồi

| Method | Endpoint                                 |
| ------ | ---------------------------------------- |
| POST   | `/api/ai/classify-response/{responseId}` |

---

## 7.2 Sinh Embedding

| Method | Endpoint                                  |
| ------ | ----------------------------------------- |
| POST   | `/api/ai/generate-embedding/{responseId}` |

---

## 7.3 AI phân tích khảo sát

| Method | Endpoint                            |
| ------ | ----------------------------------- |
| POST   | `/api/ai/analyze-survey/{surveyId}` |

---

## 7.4 AI tìm phản hồi tương tự

| Method | Endpoint                                |
| ------ | --------------------------------------- |
| GET    | `/api/ai/similar-comments/{responseId}` |

---

## 7.5 AI Chat QA Dashboard

| Method | Endpoint      |
| ------ | ------------- |
| POST   | `/api/ai/ask` |

Ví dụ:

```json
{
  "question": "Những vấn đề sinh viên phàn nàn nhiều nhất về môn OOP?"
}
```

---

# 8. Statistics Module

## 8.1 Dashboard tổng quan

| Method | Endpoint                  |
| ------ | ------------------------- |
| GET    | `/api/dashboard/overview` |

---

## 8.2 Dashboard theo khoa

| Method | Endpoint                   |
| ------ | -------------------------- |
| GET    | `/api/dashboard/faculties` |

---

## 8.3 Dashboard theo môn

| Method | Endpoint                  |
| ------ | ------------------------- |
| GET    | `/api/dashboard/subjects` |

---

## 8.4 Dashboard theo khảo sát

| Method | Endpoint                      |
| ------ | ----------------------------- |
| GET    | `/api/dashboard/surveys/{id}` |

---

# 9. Report Module

## 9.1 Sinh báo cáo

| Method | Endpoint                           |
| ------ | ---------------------------------- |
| POST   | `/api/reports/generate/{surveyId}` |

---

## 9.2 Danh sách báo cáo

| Method | Endpoint       |
| ------ | -------------- |
| GET    | `/api/reports` |

---

## 9.3 Chi tiết báo cáo

| Method | Endpoint            |
| ------ | ------------------- |
| GET    | `/api/reports/{id}` |

---

## 9.4 Xuất file

| Method | Endpoint                  |
| ------ | ------------------------- |
| GET    | `/api/reports/{id}/pdf`   |
| GET    | `/api/reports/{id}/excel` |

---

# 10. Clarification Workflow Module (Điểm đặc biệt của hệ thống)

Đây là phần chưa có trong các hệ thống khảo sát thông thường.

---

## Bước 1: Manager yêu cầu giải trình

| Method | Endpoint              |
| ------ | --------------------- |
| POST   | `/api/clarifications` |

---

## Bước 2: Giảng viên xem yêu cầu

| Method | Endpoint                       |
| ------ | ------------------------------ |
| GET    | `/api/clarifications/my-tasks` |

---

## Bước 3: Giảng viên gửi giải trình

| Method | Endpoint                          |
| ------ | --------------------------------- |
| POST   | `/api/clarifications/{id}/submit` |

Body:

```json
{
  "explanation_content": "...",
  "commitment_text": "..."
}
```

---

## Bước 4: Manager duyệt

| Method | Endpoint                           |
| ------ | ---------------------------------- |
| POST   | `/api/clarifications/{id}/approve` |
| POST   | `/api/clarifications/{id}/reject`  |

---

## Bước 5: Tranh chấp

| Method | Endpoint                           |
| ------ | ---------------------------------- |
| POST   | `/api/clarifications/{id}/dispute` |

---

# 11. Lecturer Feedback To Students

## Soạn phản hồi

| Method | Endpoint                             |
| ------ | ------------------------------------ |
| POST   | `/api/clarifications/{id}/responses` |

---

## Duyệt phản hồi

| Method | Endpoint                                  |
| ------ | ----------------------------------------- |
| POST   | `/api/responses-to-students/{id}/approve` |

---

## Sinh viên xem phản hồi

| Method | Endpoint                 |
| ------ | ------------------------ |
| GET    | `/api/student-feedbacks` |

---

# 12. Improvement Announcement Module

## Đăng thông báo cải tiến

| Method | Endpoint            |
| ------ | ------------------- |
| POST   | `/api/improvements` |

---

## Danh sách thông báo

| Method | Endpoint            |
| ------ | ------------------- |
| GET    | `/api/improvements` |

---

## Chi tiết

| Method | Endpoint                 |
| ------ | ------------------------ |
| GET    | `/api/improvements/{id}` |

---

# 13. Notification Module

## Nhận thông báo

| Method | Endpoint                    |
| ------ | --------------------------- |
| GET    | `/api/notifications`        |
| GET    | `/api/notifications/unread` |

---

## Đánh dấu đã đọc

| Method | Endpoint                       |
| ------ | ------------------------------ |
| PATCH  | `/api/notifications/{id}/read` |
| PATCH  | `/api/notifications/read-all`  |

---

## Gửi thông báo thủ công

| Method | Endpoint                  |
| ------ | ------------------------- |
| POST   | `/api/notifications/send` |

---

# 14. Employer Survey Module

Phục vụ US-16 → US-19.

## Khảo sát nhà tuyển dụng

| Method | Endpoint                               |
| ------ | -------------------------------------- |
| GET    | `/api/employer-surveys`                |
| POST   | `/api/employer-surveys/{id}/responses` |

---

## OTP Access

| Method | Endpoint                           |
| ------ | ---------------------------------- |
| POST   | `/api/employer-access/request-otp` |
| POST   | `/api/employer-access/verify-otp`  |

---

## Xem chương trình đào tạo

| Method | Endpoint                             |
| ------ | ------------------------------------ |
| GET    | `/api/training-programs`             |
| GET    | `/api/training-programs/{facultyId}` |

---

# 15. Audit & System Monitoring Module (ADMIN)

## Nhật ký hệ thống

| Method | Endpoint                |
| ------ | ----------------------- |
| GET    | `/api/system-logs`      |
| GET    | `/api/system-logs/{id}` |

---

# Thứ tự triển khai (Roadmap Backend)

### Phase 1 (MVP)

1. Auth
2. User & Role
3. Master Data
4. Survey Management
5. Survey Response
6. Notification

### Phase 2

7. Dashboard Statistics
8. Report PDF/Excel
9. Employer Survey

### Phase 3

10. AI Analysis
11. Clarification Workflow
12. Lecturer Response
13. Improvement Announcement
14. Audit Logs
