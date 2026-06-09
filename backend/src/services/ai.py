import google.genai as genai
from google.genai import types
from src.config import env
from src.models.gemini import ClassificationResponse, FinalSurveyReport
from src.repositories import survey as repo
from src.repositories.label import get_labels_by_role
from src.config.ai import build_analysis_prompt, build_classification_prompt

def estimate_tokens(text: str) -> int:
    """Ước lượng token để chia batch (1 token ~ 3 ký tự tiếng Việt)"""
    return len(text or "") // 3

def classify_survey_process(survey_id: int, role_id: int = None):
    """
    Tiến hành phân loại phản hồi mở.
    - role_id: Nếu không truyền, service sẽ tự lấy role_id từ target_config của bài khảo sát.
    """
    # 1. Lấy thông tin bài khảo sát & Xác định Role ID mục tiêu
    survey_struct = repo.get_survey_structure(survey_id)
    if not survey_struct:
        raise ValueError(f"Không tìm thấy khảo sát có ID {survey_id}")

    # Nếu không truyền role_id từ router, tự động lấy từ cấu hình khảo sát
    if role_id is None:
        role_id = survey_struct.get("target_config", {}).get("role_id")
    
    if not role_id:
        raise ValueError("Không xác định được Role mục tiêu cho bài khảo sát này.")

    # 2. Lấy danh sách nhãn (Labels) dựa trên role_id (từ bảng chung survey_label_definitions)
    labels = get_labels_by_role(role_id)
    if not labels:
        return 0 # Không có nhãn thì không cần phân loại
        
    labels_text = "\n".join([f"lb_{l['id']} | {l['label_name']}" for l in labels])
    
    # 3. Lấy tất cả câu trả lời và lọc ra các câu hỏi mở
    all_responses = repo.get_all_responses_by_survey(survey_id)
    open_questions = []
    for section in survey_struct.get("content", {}).get("sections", []):
        for q in section.get("questions", []):
            if q.get("type") == "open_ended":
                open_questions.append({"id": q.get("id"), "label": q.get("label")})

    client = genai.Client(api_key=env.GEMINI_API_KEY)
    max_tokens = int(env.MODEL_CONTEXT_WINDOW or 32000) * 0.7
    total_processed_labels = 0

    # 4. Duyệt qua từng câu hỏi mở
    for q in open_questions:
        q_id = q["id"]
        q_label = q["label"]
        
        # Gom nhóm các câu trả lời cho câu hỏi này
        question_feedbacks = []
        for r in all_responses:
            text = r.get("answers", {}).get(q_id)
            if text and len(text.strip()) > 2:
                question_feedbacks.append({"res_id": r["id"], "text": text})

        if not question_feedbacks: continue

        # 5. Chia Batch cho câu hỏi hiện tại
        batches, current_batch, current_tokens = [], [], 0
        for fb in question_feedbacks:
            tokens = estimate_tokens(fb['text'])
            if current_batch and (current_tokens + tokens > max_tokens):
                batches.append(current_batch)
                current_batch, current_tokens = [], 0
            current_batch.append(fb)
            current_tokens += tokens
        if current_batch: batches.append(current_batch)

        # 6. Gọi AI xử lý từng Batch
        for batch in batches:
            fb_text = "\n".join([f"res_{f['res_id']} | {f['text']}" for f in batch])
            prompt = build_classification_prompt(q_label, labels_text, fb_text)
            
            response = client.models.generate_content(
                model=env.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ClassificationResponse,
                    temperature=0
                )
            )
            
            parsed = ClassificationResponse.model_validate_json(response.text)
            
            # 7. Lưu kết quả gán nhãn
            rows_to_save = []
            for item in parsed.results:
                res_id = int(item.feedback_id.replace("res_", ""))
                
                # Lưu vào bảng quan hệ response_labels
                for cls in item.classifications:
                    rows_to_save.append({
                        "response_id": res_id,
                        "label_id": int(cls.label_id.replace("lb_", "")),
                        "sentiment": cls.sentiment
                    })
                
                # Cập nhật JSON tóm tắt vào bảng survey_responses để hiển thị nhanh
                summary_meta = [{"lb": c.label_id, "s": c.sentiment} for c in item.classifications]
                repo.update_response_ai_metadata(res_id, summary_meta)

            if rows_to_save:
                repo.bulk_insert_response_labels(rows_to_save)
                total_processed_labels += len(rows_to_save)

    return total_processed_labels

def generate_trend_analysis(survey_id: int):
    """Dựa trên dữ liệu đã gán nhãn và điểm số để lập báo cáo tổng hợp"""
    # 1. Lấy dữ liệu định lượng (Likert/NPS) và định tính (Text đã gán nhãn)
    stats = repo.get_survey_stats_data(survey_id)
    labeled_data = repo.get_labeled_feedbacks_for_report(survey_id)

    if not labeled_data and not stats:
        raise ValueError("Chưa có đủ dữ liệu (thống kê hoặc nhãn) để lập báo cáo.")

    # 2. Định dạng dữ liệu thống kê cho AI
    stats_lines = []
    q_analysis = stats.get('question_analysis', {})
    for q_id, info in q_analysis.items():
        q_label = info.get('question_label')
        q_stats = info.get('stats', {})
        stype = info.get('question_type')
        if stype == 'likert':
            stats_lines.append(f"- {q_label}: TB {q_stats.get('average')}/5. (Phân phối 1-5: {q_stats.get('score_distribution')})")
        elif stype == 'nps':
            stats_lines.append(f"- {q_label}: NPS {q_stats.get('score')}. (Thúc đẩy: {q_stats.get('distribution',{}).get('promoters')})")

    # 3. Gom nhóm feedback theo nhãn để AI tóm tắt từng chủ đề
    fb_groups = {}
    for item in labeled_data:
        lname = item['label_name']
        if lname not in fb_groups: fb_groups[lname] = {"pos": [], "neg": []}
        key = "pos" if item['sentiment'] == 'positive' else "neg"
        fb_groups[lname][key].append(item['text'])
    
    fb_lines = []
    for lname, content in fb_groups.items():
        fb_lines.append(f"Chủ đề [{lname}]:")
        if content['pos']: fb_lines.append(f"  + Tích cực: {'. '.join(content['pos'][:3])}")
        if content['neg']: fb_lines.append(f"  - Tiêu cực: {'. '.join(content['neg'][:3])}")

    # 4. Gọi AI lập báo cáo tổng hợp (Executive Summary & Key Findings)
    client = genai.Client(api_key=env.GEMINI_API_KEY)
    prompt = build_analysis_prompt("\n".join(stats_lines), "\n".join(fb_lines))

    response = client.models.generate_content(
        model=env.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=FinalSurveyReport,
            temperature=0.2
        )
    )

    result = FinalSurveyReport.model_validate_json(response.text)
    
    # 5. Lưu kết quả báo cáo vào DB
    repo.insert_ai_report(survey_id, result.model_dump())
    
    return result