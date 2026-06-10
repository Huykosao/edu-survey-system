def build_classification_prompt(question_text: str, labels_text: str, feedbacks_text: str) -> str:
    return f"""
Bạn là chuyên gia phân tích khảo sát. 
Dữ liệu dưới đây là các câu trả lời cho câu hỏi: "{question_text}"

NHIỆM VỤ: Gán nhãn và phân loại cảm xúc cho các phản hồi này dựa trên danh sách nhãn cung cấp.

DANH SÁCH NHÀN:
{labels_text}

DANH SÁCH PHẢN HỒI:
{feedbacks_text}
"""

def build_analysis_prompt(context: str) -> str:
    return f"""
Bạn là chuyên gia phân tích dữ liệu cao cấp. Hãy lập báo cáo tổng hợp từ dữ liệu khảo sát sau:
{context}
NHIỆM VỤ:
1. Phân tích sự tương quan giữa các con số thống kê và ý kiến thực tế của sinh viên.
2. Tóm gọn nội dung từng nhóm chủ đề (ví dụ: Cơ sở vật chất, Giảng dạy).
3. Xác định các vấn đề nghiêm trọng nhất dựa trên tỉ lệ điểm thấp và feedback tiêu cực.
4. Đưa ra các kiến nghị cải tiến cụ thể, thực tế.

YÊU CẦU: Đầu ra định dạng JSON theo schema đã định sẵn.
"""