import math
from src.config import env
from google import genai
from google.genai import types

client = genai.Client(api_key=env.GEMINI_API_KEY)

student_labels = [
    "Cơ sở vật chất: bàn ghế, máy tính, điều hòa, ánh sáng, phòng thực hành, thiết bị vệ sinh và hạ tầng phòng học.", 
    "Giảng viên và Cách giảng dạy: thái độ thầy cô, phương pháp sư phạm, tốc độ giảng bài, sự nhiệt tình và khả năng truyền đạt.", 
    "Tài liệu và Giáo trình: chất lượng sách, bài giảng điện tử (slides), tài liệu photo, sách tham khảo và nguồn học liệu.", 
    "Thủ tục hành chính và Học phí: đăng ký học phần, cấp thẻ sinh viên, học bổng, học phí, dịch vụ một cửa và hỗ trợ từ phòng ban.",
    "Chương trình đào tạo và Chấm điểm: khối lượng kiến thức, độ khó của đề thi, tính công bằng khi chấm điểm và cấu trúc môn học."
]

student_label_names_display = [
    "Cơ sở vật chất", 
    "Chất lượng giảng dạy", 
    "Tài liệu học tập", 
    "Dịch vụ hành chính & Học phí",
    "Chương trình & Đánh giá"
]

teacher_labels = [
    "Phản hồi về Sự cân đối giữa giờ giảng, hoạt động nghiên cứu khoa học và mức thu nhập, chế độ khen thưởng, phúc lợi.",
    "Phản hồi về Nguồn kinh phí hỗ trợ nghiên cứu khoa học, thời gian dành cho học thuật và tỷ lệ hoàn thành các chỉ tiêu (KPIs) giao phó.",
    "Phản hồi về Nhu cầu đào tạo các công cụ giảng dạy trực tuyến, nền tảng số hóa quản lý lớp học và hạ tầng công nghệ thông tin.",
    "Phản hồi về Sự dân chủ trong trường học, các quy định hành chính nội bộ và sự hỗ trợ từ các phòng ban chức năng."
]

teacher_label_names_display = [
    "Khối lượng công việc & đãi ngộ",
    "Điều kiện nghiên cứu",
    "Hỗ trợ công nghệ",
    "Môi trường & Quy chế"
]

label_response = client.models.embed_content(
    model=env.GEMINI_EMBEDING_MODEL,
    contents=student_labels,
    config=types.EmbedContentConfig(task_type="CLASSIFICATION",output_dimensionality=1536)
)
label_vectors = [e.values for e in label_response.embeddings]

student_feedbacks = [
    "Không có giáo trình cụ thể cho môn này, toàn phải tự tìm trên mạng",
    "Máy tính ở phòng thực hành quá chậm, thường xuyên bị treo máy",
    "Giảng viên rất nhiệt tình nhưng tốc độ giảng bài hơi nhanh",
    "Thủ tục xin cấp lại thẻ sinh viên quá rắc rối và mất thời gian",
    "Phòng học thiếu ánh sáng và điều hòa không hoạt động tốt",
    "Thầy dạy rất hay nhưng tài liệu photo kèm theo hơi mờ va máy tính ở phòng thực hành quá chậm,",
    "Ho tro sinh vien khong duoc tot lam, hoc bong it",
    "Thay Le Van Min phan hoi tin nhan hoc sinh cham"
]

def _cosine_similarity(v1, v2):
    dot_product = sum(x * y for x, y in zip(v1, v2))
    mag1 = math.sqrt(sum(x**2 for x in v1))
    mag2 = math.sqrt(sum(x**2 for x in v2))
    return dot_product / (mag1 * mag2) if mag1 and mag2 else 0

def classify_feedback(text, label_embs, label_display, threshold=0.75):
    res = client.models.embed_content(
        model=env.GEMINI_EMBEDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="CLASSIFICATION", output_dimensionality=1536)
    )
    student_vec = res.embeddings[0].values
    
    matches = []
    for i in range(len(label_embs)):
        score = _cosine_similarity(student_vec, label_embs[i])
        if score > threshold:
            matches.append({"label": label_display[i], "score": score})
    
    matches.sort(key=lambda x: x['score'], reverse=True)
    return matches



if __name__ == "__main__":
    test_feedbacks = [
        "Không có giáo trình cụ thể cho môn này, toàn phải tự tìm trên mạng",
        "Thầy dạy rất hay nhưng tài liệu photo kèm theo hơi mờ và máy tính ở phòng thực hành quá chậm", # Câu này có 3 ý
        "Hỗ trợ sinh viên không được tốt lắm, học bổng ít",
        "Phòng học nóng quá, điều hòa hỏng mà giảng viên lại hay đi muộn",
        "Máy tính phòng thực hành quá chậm",
        "Giang vien Le Van Minh trả lời tin nhắn học sinh chậm."
    ]

    print(f"{'PHẢN HỒI CỦA SINH VIÊN':<65} | {'PHÂN LOẠI ĐA NHÃN (CONFIDENCE)'}")
    print("-" * 120)

    for text in test_feedbacks:
        results = classify_feedback(text, label_vectors, student_label_names_display)
        
        if not results:
            prediction = "Không xác định"
        else:
            prediction = " | ".join([f"{r['label']} ({r['score']:.2%})" for r in results])
        
        print(f"{text[:63]:<65} | {prediction}")
