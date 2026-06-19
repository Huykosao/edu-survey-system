import google.genai as genai
from google.genai import types
from src.config import env
from src.models.gemini import ClassificationResponse, FinalSurveyReport
from src.repositories import survey as survey_repo
from src.repositories import ai_report
from src.repositories.label import get_labels_by_role
from src.config.ai import build_analysis_prompt, build_classification_prompt

import traceback
from collections import defaultdict

# ─────────────────────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────────────────────

def estimate_tokens(text: str) -> int:
    """Ước lượng token để chia batch (1 token ~ 3 ký tự tiếng Việt)"""
    return len(text or "") // 3


# ─────────────────────────────────────────────────────────────
# GÁN NHÃN (LABELING)
# ─────────────────────────────────────────────────────────────

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

    # 2. Lấy danh sách nhãn (Labels) dựa trên role_id
    labels = get_labels_by_role(role_id)
    if not labels:
        return 0  # Không có nhãn thì không cần phân loại

    labels_text = "\n".join([f"lb_{l['id']} | {l['label_name']}" for l in labels])

    # 3. Lọc ra các câu hỏi mở từ cấu trúc khảo sát
    open_questions = []
    for section in survey_struct.get("content", {}).get("sections", []):
        for q in section.get("questions", []):
            if q.get("type") == "open_ended":
                open_questions.append({"id": q.get("id"), "label": q.get("label")})

    # Nếu không có câu hỏi mở → bỏ qua, không gọi AI
    if not open_questions:
        print(f"[classify] survey_id={survey_id}: Không có câu hỏi mở, bỏ qua gán nhãn.")
        return 0

    # 4. Lấy tất cả câu trả lời
    all_responses = survey_repo.get_all_responses_by_survey(survey_id)

    # Nếu không có phản hồi nào → bỏ qua, không gọi AI
    if not all_responses:
        print(f"[classify] survey_id={survey_id}: Không có phản hồi nào, bỏ qua gán nhãn.")
        return 0

    client = genai.Client(api_key=env.GEMINI_API_KEY)

    # Giới hạn context window: dùng 70% để dành buffer cho system prompt + labels
    max_tokens_per_batch = int(env.MODEL_CONTEXT_WINDOW or 32000) * 0.7
    # Giới hạn tối đa số item mỗi batch để tránh quá tải
    MAX_ITEMS_PER_BATCH = 100

    total_processed_labels = 0

    # 5. Duyệt qua từng câu hỏi mở
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

        # Không có phản hồi cho câu hỏi này → bỏ qua
        if not question_feedbacks:
            print(f"[classify] q_id={q_id}: Không có phản hồi nào, bỏ qua.")
            continue

        # 6. Chia batch theo cả token lẫn số lượng item
        batches, current_batch, current_tokens = [], [], 0
        for fb in question_feedbacks:
            tokens = estimate_tokens(fb['text'])
            token_overflow = current_batch and (current_tokens + tokens > max_tokens_per_batch)
            item_overflow = len(current_batch) >= MAX_ITEMS_PER_BATCH
            if token_overflow or item_overflow:
                batches.append(current_batch)
                current_batch, current_tokens = [], 0
            current_batch.append(fb)
            current_tokens += tokens
        if current_batch:
            batches.append(current_batch)

        print(f"[classify] q_id={q_id} ({q_label}): {len(question_feedbacks)} phản hồi → {len(batches)} batch(es)")

        # 7. Gọi AI xử lý từng batch
        for batch_idx, batch in enumerate(batches):
            # Tạo set ID đầu vào để kiểm tra tính hợp lệ của kết quả trả về
            input_ids = {str(f["res_id"]) for f in batch}

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

            # 8. Lưu kết quả — với kiểm tra ID hợp lệ
            rows_to_save = []
            missing_ids = set(input_ids)  # tracking các ID chưa được trả về

            for item in parsed.results:
                raw_id = item.feedback_id.replace("res_", "")

                # ── Kiểm tra: AI trả về ID không có trong batch đầu vào ──
                if raw_id not in input_ids:
                    print(
                        f"[classify] WARN batch {batch_idx}: AI trả về feedback_id={item.feedback_id} "
                        f"không có trong đầu vào, bỏ qua."
                    )
                    continue

                missing_ids.discard(raw_id)  # đánh dấu đã xử lý

                res_id = int(raw_id)
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

            # ── Log các ID bị thiếu (AI không trả về) ──
            if missing_ids:
                print(
                    f"[classify] WARN batch {batch_idx} q_id={q_id}: "
                    f"AI không trả về kết quả cho {len(missing_ids)} phản hồi: {missing_ids}. "
                    f"Các phản hồi này sẽ không có nhãn (missing)."
                )

            if rows_to_save:
                survey_repo.bulk_insert_response_labels(rows_to_save)
                total_processed_labels += len(rows_to_save)

    return total_processed_labels


# ─────────────────────────────────────────────────────────────
# PHÂN TÍCH XU HƯỚNG (TREND ANALYSIS)
# ─────────────────────────────────────────────────────────────

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
            ai_report.get_dashboard_overview(survey_id) or {}
        )
        label_summary = (
            ai_report.get_label_sentiment_summary(survey_id) or []
        )
        # Loại bỏ nhãn spam khỏi thống kê theo nhãn
        label_summary = [
            row for row in label_summary
            if "spam" not in str(row.get("label_name") or "").lower()
        ]

        question_summary = (
            ai_report.get_question_sentiment_summary(survey_id) or []
        )

        # ── Lấy feedback examples (chỉ dùng để xây dựng label+sentiment summary,
        #    KHÔNG đưa nguyên văn vào prompt) ──
        feedback_examples = (
            ai_report.get_feedback_examples(survey_id, limit=50) or []
        )
        # Loại bỏ tất cả câu trả lời có nhãn là spam
        feedback_examples = [
            fb for fb in feedback_examples
            if "spam" not in str(fb.get("label_name") or "").lower()
        ]

        # ── Kiểm tra: nếu không có dữ liệu nào thì không gọi AI ──
        if (
            not q_analysis
            and not label_summary
            and not feedback_examples
        ):
            raise ValueError(
                "Chưa có đủ dữ liệu để lập báo cáo. "
                "Hãy chạy gán nhãn AI trước hoặc đảm bảo đã có phản hồi khảo sát."
            )

        # =====================================================
        # 2. QUANTITATIVE ANALYSIS (thống kê định lượng)
        # =====================================================
        stats_lines = []
        q_idx = 0

        for q_id, info in q_analysis.items():
            q_idx += 1
            q_label = info.get("question_label") or q_id
            q_stats = info.get("stats", {}) or {}
            stype = info.get("question_type")
            total = q_stats.get("total", 0) or 0
            # Số người thực sự phản hồi câu này (không tính bỏ trống)
            respondents = total

            if stype == "likert":
                dist = q_stats.get("score_distribution", {}) or {}
                dist_lines = []
                for score in range(1, 6):
                    count = dist.get(str(score), 0)
                    pct = round(count / respondents * 100, 1) if respondents else 0
                    dist_lines.append(f"  - Mức {score}: {count} phiếu ({pct}%)")
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: Thang đo Likert (1–5)\n"
                    f"- Số người phản hồi: {respondents}\n"
                    f"- Điểm trung bình: {q_stats.get('average', 'N/A')}/5\n"
                    f"- Phân phối:\n" + "\n".join(dist_lines)
                )

            elif stype == "nps":
                dist = q_stats.get("distribution", {}) or {}
                promoters = dist.get("promoters", 0)
                detractors = dist.get("detractors", 0)
                passives = dist.get("passives", 0)
                p_pct = round(promoters / respondents * 100, 1) if respondents else 0
                d_pct = round(detractors / respondents * 100, 1) if respondents else 0
                pa_pct = round(passives / respondents * 100, 1) if respondents else 0
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: NPS (0–10)\n"
                    f"- Số người phản hồi: {respondents}\n"
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
                    pct = round(count / respondents * 100, 1) if respondents else 0
                    dist_lines.append(f"  - \"{option}\": {count} lượt ({pct}%)")
                type_label = "Trắc nghiệm một đáp án" if stype == "single_choice" else "Trắc nghiệm nhiều đáp án"
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: {type_label}\n"
                    f"- Số người phản hồi: {respondents}\n"
                    f"- Phân phối lựa chọn:\n" + ("\n".join(dist_lines) if dist_lines else "  (Chưa có dữ liệu)")
                )

            elif stype == "matrix":
                rows_data = q_stats.get("rows_data", {}) or {}
                row_lines = []
                for row_label_name, col_dist in rows_data.items():
                    row_total = sum(col_dist.values()) if col_dist else 0
                    col_parts = []
                    for col, cnt in sorted((col_dist or {}).items(), key=lambda x: -x[1]):
                        pct = round(cnt / row_total * 100, 1) if row_total else 0
                        col_parts.append(f"{col}: {cnt} ({pct}%)")
                    row_lines.append(f"  - {row_label_name}: " + " | ".join(col_parts))
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: Ma trận đánh giá\n"
                    f"- Số người phản hồi: {respondents}\n"
                    f"- Phân phối theo tiêu chí:\n" + ("\n".join(row_lines) if row_lines else "  (Chưa có dữ liệu)")
                )

            elif stype == "open_ended":
                stats_lines.append(
                    f"Câu {q_idx}: {q_label}\n"
                    f"- Loại: Câu hỏi mở\n"
                    f"- Số người phản hồi: {respondents}"
                )

        # =====================================================
        # 3. OVERVIEW (tổng quan)
        # =====================================================
        overview_lines = []
        if overview:
            total_responses = overview.get('total_responses', 0)
            total_open = overview.get('total_open_feedbacks', 0)
            total_labels = overview.get('total_labels', 0)
            positive = overview.get('positive_count', 0)
            negative = overview.get('negative_count', 0)
            neutral = overview.get('neutral_count', 0)

            overview_lines.append(
                f"Tổng số người tham gia khảo sát: {total_responses}\n"
                f"Tổng phản hồi câu hỏi mở: {total_open}\n"
                f"Tổng nhãn AI đã gán: {total_labels}\n"
                f"Cảm xúc tổng hợp — Tích cực: {positive} | Tiêu cực: {negative} | Trung lập: {neutral}"
            )

        # =====================================================
        # 4. LABEL SUMMARY (thống kê theo nhãn)
        # =====================================================
        label_lines = []
        for row in label_summary:
            label_lines.append(
                f"Chủ đề: {row['label_name']}\n"
                f"- Tổng phản hồi: {row['total_count']}\n"
                f"- Tích cực: {row['positive_count']}\n"
                f"- Tiêu cực: {row['negative_count']}\n"
                f"- Trung lập: {row['neutral_count']}"
            )

        # =====================================================
        # 5. QUESTION SUMMARY (thống kê cảm xúc theo câu hỏi mở)
        # =====================================================
        question_lines = []
        for row in question_summary:
            question_lines.append(
                f"Câu hỏi mở: {row['question_id']}\n"
                f"- Tổng phản hồi: {row['total_count']}\n"
                f"- Tích cực: {row['positive_count']}\n"
                f"- Tiêu cực: {row['negative_count']}\n"
                f"- Trung lập: {row['neutral_count']}"
            )

        # =====================================================
        # 6. LABEL-SENTIMENT DIGEST
        #    Chỉ đưa nhãn + cảm xúc vào prompt, KHÔNG đưa nguyên văn phản hồi
        # =====================================================
        # Xây dựng bảng tổng hợp: label → sentiment_counts (từ feedback_examples)
        label_digest: dict[str, dict] = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0})
        for fb in feedback_examples:
            label = fb.get("label_name", "Unknown")
            sentiment = (fb.get("sentiment") or "neutral").lower()
            if sentiment in label_digest[label]:
                label_digest[label][sentiment] += 1

        digest_lines = []
        for label, counts in label_digest.items():
            total_lbl = sum(counts.values())
            pos_pct = round(counts["positive"] / total_lbl * 100, 1) if total_lbl else 0
            neg_pct = round(counts["negative"] / total_lbl * 100, 1) if total_lbl else 0
            neu_pct = round(counts["neutral"] / total_lbl * 100, 1) if total_lbl else 0
            digest_lines.append(
                f"- {label}: {total_lbl} phản hồi "
                f"(+{counts['positive']} {pos_pct}% / -{counts['negative']} {neg_pct}% / ~{counts['neutral']} {neu_pct}%)"
            )

        # =====================================================
        # 7. BUILD CONTEXT (ngữ cảnh đưa vào prompt AI)
        # =====================================================
        analysis_context = f"""
=== THÔNG TIN KHẢO SÁT ===
Tên khảo sát: {survey_title}
Mã khảo sát: {survey_id}
Mô tả: {survey_desc}

=== TỔNG QUAN ===

{chr(10).join(overview_lines)}

=== KẾT QUẢ ĐỊNH LƯỢNG (theo từng câu hỏi) ===

{chr(10).join(stats_lines) if stats_lines else "(Không có dữ liệu định lượng)"}

=== THỐNG KÊ THEO CHỦ ĐỀ (nhãn AI) ===

{chr(10).join(label_lines) if label_lines else "(Chưa có nhãn AI)"}

=== THỐNG KÊ CẢM XÚC THEO CÂU HỎI MỞ ===

{chr(10).join(question_lines) if question_lines else "(Chưa có dữ liệu câu hỏi mở)"}

=== PHÂN TÍCH CẢM XÚC THEO CHỦ ĐỀ (từ gán nhãn AI, không có nguyên văn) ===

{chr(10).join(digest_lines) if digest_lines else "(Chưa có dữ liệu phân tích cảm xúc)"}
""".strip()

        # =====================================================
        # 8. AI GENERATION
        # =====================================================
        client = genai.Client(api_key=env.GEMINI_API_KEY)
        prompt = build_analysis_prompt(analysis_context)

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

        # =====================================================
        # 9. SAVE REPORT
        # =====================================================
        survey_repo.insert_ai_report(survey_id, result.model_dump())

        return result

    except Exception as e:
        raise e