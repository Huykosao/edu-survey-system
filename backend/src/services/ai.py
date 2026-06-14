import google.genai as genai
from google.genai import types
from src.config import env
from src.models.gemini import ClassificationResponse, FinalSurveyReport
from src.repositories import survey as survey_repo
from src.repositories import ai_report
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
    survey_struct = survey_repo.get_survey_structure(survey_id)
    if not survey_struct:
        raise ValueError(f"Không tìm thấy khảo sát có ID {survey_id}")

    # Nếu không truyền role_id từ router, tự động lấy từ cấu hình khảo sát
    if role_id is None:
        role_id = survey_struct.get("target_config", {}).get("role_id")
        if not role_id:
            role_name = survey_struct.get("target_config", {}).get("role")
            if role_name:
                role_map = {
                    "ADMIN": 1,
                    "MANAGER": 2,
                    "LECTURER": 2,
                    "ALUMNI": 3,
                    "STUDENT": 4,
                    "EMPLOYER": 5
                }
                role_id = role_map.get(str(role_name).upper())
    
    if not role_id:
        raise ValueError("Không xác định được Role mục tiêu cho bài khảo sát này.")

    # 2. Lấy danh sách nhãn (Labels) dựa trên role_id (từ bảng chung survey_label_definitions)
    labels = get_labels_by_role(role_id)
    if not labels:
        return 0 # Không có nhãn thì không cần phân loại
        
    labels_text = "\n".join([f"lb_{l['id']} | {l['label_name']}" for l in labels])
    
    # 3. Lấy tất cả câu trả lời và lọc ra các câu hỏi mở
    all_responses = survey_repo.get_all_responses_by_survey(survey_id)
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
                question_feedbacks.append({
                    "res_id": r["id"],
                    "question_id": q_id,
                    "text": text
                })

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
            fb_text = "\n".join([
                f"res_{f['res_id']}|{f['question_id']}|{f['text']}"
                for f in batch
            ])
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
                        "question_id": item.question_id,
                        "label_id": int(cls.label_id.replace("lb_", "")),
                        "sentiment": cls.sentiment,
                        "feedback_text": next(
                            f["text"]
                            for f in batch
                            if f["res_id"] == res_id
                            and f["question_id"] == item.question_id
                        )
                    })
                
                # # Cập nhật JSON tóm tắt vào bảng survey_responses để hiển thị nhanh
                # summary_meta = [{"lb": c.label_id, "s": c.sentiment} for c in item.classifications]
                # survey_repo.update_response_ai_metadata(res_id, summary_meta)

            if rows_to_save:
                survey_repo.bulk_insert_response_labels(rows_to_save)
                total_processed_labels += len(rows_to_save)

    return total_processed_labels

from collections import defaultdict

import traceback
from collections import defaultdict

def generate_trend_analysis(survey_id: int):

    print("\n==============================")
    print(f"START AI REPORT survey_id={survey_id}")
    print("==============================\n")

    try:
        from src.services.survey import get_survey_analysis

        # =====================================================
        # 1. LOAD DATA & FILTER SPAM
        # =====================================================
        survey = survey_repo.get_survey_by_id(survey_id)
        if not survey:
            raise ValueError(f"Không tìm thấy khảo sát có ID {survey_id}")
        survey_title = survey.get("title", f"Khảo sát #{survey_id}")
        survey_desc = survey.get("description") or ""

        analysis_data = get_survey_analysis(survey_id)
        q_analysis = analysis_data.get("analysis", {}) or {}

        overview = (
            ai_report.get_dashboard_overview(
                survey_id
            ) or {}
        )
        label_summary = (
            ai_report.get_label_sentiment_summary(
                survey_id
            ) or []
        )
        # Loại bỏ nhãn spam khỏi thống kê theo nhãn
        label_summary = [
            row for row in label_summary
            if "spam" not in str(row.get("label_name") or "").lower()
        ]

        question_summary = (
            ai_report.get_question_sentiment_summary(
                survey_id
            ) or []
        )
        feedback_examples = (
            ai_report.get_feedback_examples(
                survey_id,
                limit=50
            ) or []
        )
        # Loại bỏ tất cả câu trả lời có nhãn là spam
        feedback_examples = [
            fb for fb in feedback_examples
            if "spam" not in str(fb.get("label_name") or "").lower()
        ]

        if (
            not q_analysis
            and not label_summary
            and not feedback_examples
        ):
            raise ValueError(
                "Chưa có đủ dữ liệu để lập báo cáo."
            )

        # =====================================================
        # 2. QUANTITATIVE ANALYSIS
        # =====================================================
        stats_lines = []

        q_idx = 0
        for q_id, info in q_analysis.items():
            q_idx += 1
            q_label = info.get("question_label") or q_id
            q_stats = info.get("stats", {}) or {}
            stype = info.get("question_type")
            total = q_stats.get("total", 0) or 0

            if stype == "likert":
                dist = q_stats.get("score_distribution", {}) or {}
                dist_lines = []
                for score in range(1, 6):
                    count = dist.get(str(score), 0)
                    pct = round(count / total * 100, 1) if total else 0
                    dist_lines.append(f"  - Mức {score}: {count} phiếu ({pct}%)")
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: Thang đo Likert (1–5)\n"
                    f"- Tổng phản hồi: {total}\n"
                    f"- Điểm trung bình: {q_stats.get('average', 'N/A')}/5\n"
                    f"- Phân phối:\n" + "\n".join(dist_lines)
                )

            elif stype == "nps":
                dist = q_stats.get("distribution", {}) or {}
                promoters = dist.get("promoters", 0)
                detractors = dist.get("detractors", 0)
                passives = dist.get("passives", 0)
                p_pct = round(promoters / total * 100, 1) if total else 0
                d_pct = round(detractors / total * 100, 1) if total else 0
                pa_pct = round(passives / total * 100, 1) if total else 0
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: NPS (0–10)\n"
                    f"- Tổng phản hồi: {total}\n"
                    f"- Điểm NPS: {q_stats.get('score', 'N/A')}\n"
                    f"- Phân phối:\n"
                    f"  - Ủng hộ (Promoter 9–10): {promoters} ({p_pct}%)\n"
                    f"  - Trung lập (Passive 7–8): {passives} ({pa_pct}%)\n"
                    f"  - Không hài lòng (Detractor 0–6): {detractors} ({d_pct}%)"
                )

            elif stype in ("single_choice", "multiple_choice"):
                dist = q_stats.get("distribution", {}) or {}
                dist_lines = []
                for option, count in sorted(dist.items(), key=lambda x: -x[1]):
                    pct = round(count / total * 100, 1) if total else 0
                    dist_lines.append(f"  - \"{option}\": {count} lượt ({pct}%)")
                type_label = "Trắc nghiệm một đáp án" if stype == "single_choice" else "Trắc nghiệm nhiều đáp án"
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: {type_label}\n"
                    f"- Tổng phiếu trả lời: {total}\n"
                    f"- Phân phối lựa chọn:\n" + ("\n".join(dist_lines) if dist_lines else "  (Chưa có dữ liệu)")
                )

            elif stype == "matrix":
                rows_data = q_stats.get("rows_data", {}) or {}
                row_lines = []
                for row_label, col_dist in rows_data.items():
                    row_total = sum(col_dist.values()) if col_dist else 0
                    col_parts = []
                    for col, cnt in sorted(col_dist.items(), key=lambda x: -x[1]):
                        pct = round(cnt / row_total * 100, 1) if row_total else 0
                        col_parts.append(f"{col}: {cnt} ({pct}%)")
                    row_lines.append(f"  - {row_label}: " + " | ".join(col_parts))
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: Ma trận đánh giá\n"
                    f"- Tổng phiếu: {total}\n"
                    f"- Phân phối theo tiêu chí:\n" + ("\n".join(row_lines) if row_lines else "  (Chưa có dữ liệu)")
                )

            elif stype == "open_ended":
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: Câu hỏi mở\n"
                    f"- Tổng phản hồi: {total}"
                )


        # =====================================================
        # 3. OVERVIEW
        # =====================================================
        overview_lines = []

        if overview:

            overview_lines.append(
                f"""
Tổng số phiếu khảo sát: {overview.get('total_responses', 0)}
Tổng phản hồi mở: {overview.get('total_open_feedbacks', 0)}
Tổng nhãn AI đã gán: {overview.get('total_labels', 0)}

Positive: {overview.get('positive_count', 0)}
Negative: {overview.get('negative_count', 0)}
Neutral: {overview.get('neutral_count', 0)}
""".strip()
            )
        # =====================================================
        # 4. LABEL SUMMARY
        # =====================================================
        label_lines = []

        for row in label_summary:

            label_lines.append(
                f"""
Chủ đề: {row['label_name']}

- Tổng phản hồi: {row['total_count']}
- Tích cực: {row['positive_count']}
- Tiêu cực: {row['negative_count']}
- Trung lập: {row['neutral_count']}
""".strip()
            )
        # =====================================================
        # 5. QUESTION SUMMARY
        # =====================================================
        question_lines = []

        for row in question_summary:

            question_lines.append(
                f"""
Câu hỏi mở: {row['question_id']}

- Tổng phản hồi: {row['total_count']}
- Tích cực: {row['positive_count']}
- Tiêu cực: {row['negative_count']}
- Trung lập: {row['neutral_count']}
""".strip()
            )
        # =====================================================
        # 6. FEEDBACK EXAMPLES
        # =====================================================
        grouped_feedbacks = defaultdict(
            lambda: {
                "positive": [],
                "negative": [],
                "neutral": []
            }
        )

        for fb in feedback_examples:

            label = fb["label_name"]

            sentiment = (
                fb["sentiment"]
                or "neutral"
            ).lower()

            if sentiment not in grouped_feedbacks[label]:
                continue

            if len(
                grouped_feedbacks[label][sentiment]
            ) < 3:

                grouped_feedbacks[label][
                    sentiment
                ].append(
                    {
                        "question_id": fb["question_id"],
                        "text": fb["feedback_text"]
                    }
                )

        feedback_lines = []

        for label, sentiments in grouped_feedbacks.items():

            feedback_lines.append(
                f"\n===== {label} ====="
            )

            for sentiment_type in [
                "positive",
                "negative",
                "neutral"
            ]:

                if sentiments[sentiment_type]:

                    feedback_lines.append(
                        f"\n{sentiment_type.upper()}:"
                    )

                    for item in sentiments[
                        sentiment_type
                    ]:

                        feedback_lines.append(
                            f"- [{item['question_id']}] {item['text']}"
                        )
        # =====================================================
        # 7. BUILD CONTEXT
        # =====================================================
        analysis_context = f"""
=== SURVEY INFO ===
Tên khảo sát: {survey_title}
Mã khảo sát: {survey_id}
Mô tả khảo sát: {survey_desc}

=== DASHBOARD OVERVIEW ===

{chr(10).join(overview_lines)}

=== QUANTITATIVE RESULTS ===

{chr(10).join(stats_lines)}

=== LABEL SENTIMENT SUMMARY ===

{chr(10).join(label_lines)}

=== OPEN QUESTION SUMMARY ===

{chr(10).join(question_lines)}

=== FEEDBACK EXAMPLES ===

{chr(10).join(feedback_lines)}
"""
        # =====================================================
        # 8. AI GENERATION
        # =====================================================
        client = genai.Client(
            api_key=env.GEMINI_API_KEY
        )
        prompt = build_analysis_prompt(
            analysis_context
        )

        response = client.models.generate_content(
            model=env.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FinalSurveyReport,
                temperature=0.2
            )
        )
        result = (
            FinalSurveyReport
            .model_validate_json(
                response.text
            )
        )

        # =====================================================
        # 9. SAVE REPORT
        # =====================================================
        survey_repo.insert_ai_report(
            survey_id,
            result.model_dump()
        )

        return result

    except Exception as e:
        raise e