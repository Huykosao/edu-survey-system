def build_classification_prompt(question_text: str, labels_text: str, feedbacks_text: str) -> str:
    return f"""
Bạn là chuyên gia phân tích phản hồi khảo sát giáo dục.
Dữ liệu dưới đây là các câu trả lời cho câu hỏi mở: "{question_text}"

NHIỆM VỤ: Gán nhãn và phân loại cảm xúc cho từng phản hồi dựa trên danh sách nhãn được cung cấp.

DANH SÁCH NHÃN:
{labels_text}

═══════════════════════════════════════════════════════════
QUY TẮC QUAN TRỌNG — PHẢN HỒI SPAM / KHÔNG CÓ GIÁ TRỊ:
═══════════════════════════════════════════════════════════
Nếu trong danh sách nhãn có nhãn mang tên "SPAM" hoặc tương tự (spam, không có giá trị, vô nghĩa...), 
hãy sử dụng nhãn đó để gán cho các phản hồi thuộc một trong các trường hợp sau:

  1. Ký tự ngẫu nhiên / vô nghĩa:
     - VD: "asdfgh", "123456", "aaaaaaa", "............", "!!!!"
  2. Quá ngắn và không trả lời câu hỏi:
     - VD: "ok", ".", "-", "x", "không biết" (không kèm giải thích)
  3. Hoàn toàn lạc đề — không liên quan gì đến câu hỏi:
     - VD: (câu hỏi về chất lượng giảng dạy) → "hôm nay trời đẹp", "tôi thích ăn phở"
  4. Câu đùa giỡn, thử nghiệm rõ ràng:
     - VD: "test test", "đây là câu trả lời giả", "abcxyz haha"
  5. Chỉ có emoji, dấu chấm, dấu cách lặp lại:
     - VD: "😂😂😂", "   ", "........."
  6. Copy-paste vô nghĩa hoặc lặp lại từ cùng một cụm từ nhiều lần:
     - VD: "tốt tốt tốt tốt tốt tốt"

Phản hồi spam → gán nhãn SPAM với sentiment: "neutral"

PHẢN HỒI CÓ GIÁ TRỊ DÙ NGẮN — KHÔNG phân loại là spam:
  - "Thầy dạy tốt" → hợp lệ, có nội dung rõ ràng
  - "Cần cải thiện tài liệu" → hợp lệ, có ý kiến cụ thể
  - "Không hài lòng với cơ sở vật chất" → hợp lệ
  - "Cần thêm thực hành" → hợp lệ
═══════════════════════════════════════════════════════════

DANH SÁCH PHẢN HỒI CẦN PHÂN LOẠI:
{feedbacks_text}

LƯU Ý:
- Mỗi phản hồi CHỈ được gán 1-3 nhãn phù hợp nhất (hoặc 1 nhãn SPAM nếu là spam).
- Phản hồi đã bị xác định là SPAM thì KHÔNG gán thêm nhãn nội dung khác.
- sentiment chỉ nhận 3 giá trị: "positive", "negative", "neutral".
"""


def build_analysis_prompt(context: str) -> str:
    return f"""
Bạn là chuyên gia phân tích dữ liệu giáo dục cao cấp. Hãy lập báo cáo tổng hợp từ dữ liệu khảo sát sau:
{context}

NHIỆM VỤ:
1. Phân tích sự tương quan giữa các con số thống kê (tỷ lệ %, điểm trung bình) và ý kiến thực tế của sinh viên/học viên.
2. Tóm gọn nội dung từng nhóm chủ đề (ví dụ: Cơ sở vật chất, Chất lượng giảng dạy, Chương trình học, Môn học).
3. Xác định các vấn đề nghiêm trọng nhất dựa trên tỉ lệ điểm thấp và phản hồi tiêu cực cũng như các câu trả lời của khảo sát.
4. Đưa ra các kiến nghị cải tiến cụ thể, có tính thực tiễn cao.

YÊU CẦU: Đầu ra định dạng JSON theo schema đã định sẵn. Viết bằng tiếng Việt.
"""