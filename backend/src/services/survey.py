"""
services/survey.py
───────────────────
Business logic cho quản lý survey và survey responses.
Bao gồm validation cấu trúc content (SurveyContent) và answers khi submit.
"""

from fastapi import HTTPException
from src.repositories import survey as survey_repo
from src.schemas.survey import SurveyContent, QuestionType
from collections import Counter

# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_content(content_raw: dict) -> SurveyContent:
    """Parse và validate dict content theo schema SurveyContent."""
    try:
        return SurveyContent.model_validate(content_raw)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Cấu trúc content không hợp lệ: {str(e)}"
        )


def _validate_answers(answers: dict, content: SurveyContent) -> None:
    """
    Validate answers theo schema từng câu hỏi.
    - Required question phải có câu trả lời
    - Kiểm tra giá trị hợp lệ (likert 1-5, nps 0-10, single_choice trong options...)
    """
    questions = content.all_questions()
    question_map = {q.id: q for q in questions}

    errors: list[str] = []

    for q in questions:
        answer = answers.get(q.id)

        # Kiểm tra required
        if q.required and (answer is None or answer == "" or answer == [] or answer == {}):
            errors.append(f"Câu hỏi '{q.id}' là bắt buộc nhưng chưa có câu trả lời.")
            continue

        if answer is None:
            continue  # optional, bỏ qua

        # Validate theo từng loại
        if q.type == QuestionType.LIKERT:
            if not isinstance(answer, int) or not (1 <= answer <= 5):
                errors.append(f"Câu hỏi '{q.id}' (Likert): câu trả lời phải là số nguyên từ 1 đến 5, nhận được: {answer!r}")

        elif q.type == QuestionType.NPS:
            if not isinstance(answer, int) or not (0 <= answer <= 10):
                errors.append(f"Câu hỏi '{q.id}' (NPS): câu trả lời phải là số nguyên từ 0 đến 10, nhận được: {answer!r}")

        elif q.type == QuestionType.SINGLE_CHOICE:
            if answer not in q.options:
                errors.append(f"Câu hỏi '{q.id}' (Single Choice): '{answer}' không nằm trong danh sách lựa chọn hợp lệ.")

        elif q.type == QuestionType.MULTIPLE_CHOICE:
            if not isinstance(answer, list):
                errors.append(f"Câu hỏi '{q.id}' (Multiple Choice): câu trả lời phải là danh sách.")
            else:
                invalid = [v for v in answer if v not in q.options]
                if invalid:
                    errors.append(f"Câu hỏi '{q.id}' (Multiple Choice): các lựa chọn không hợp lệ: {invalid}")
                if q.max_selections and len(answer) > q.max_selections:
                    errors.append(f"Câu hỏi '{q.id}' (Multiple Choice): chỉ được chọn tối đa {q.max_selections} lựa chọn.")

        elif q.type == QuestionType.MATRIX:
            if not isinstance(answer, dict):
                errors.append(f"Câu hỏi '{q.id}' (Matrix): câu trả lời phải là object {{row: column}}.")
            else:
                if q.required:
                    missing_rows = [r for r in q.rows if r not in answer]
                    if missing_rows:
                        errors.append(f"Câu hỏi '{q.id}' (Matrix): thiếu câu trả lời cho các tiêu chí: {missing_rows}")
                for row, val in answer.items():
                    if row not in q.rows:
                        errors.append(f"Câu hỏi '{q.id}' (Matrix): tiêu chí '{row}' không tồn tại.")
                    elif val not in q.columns:
                        errors.append(f"Câu hỏi '{q.id}' (Matrix): giá trị '{val}' cho tiêu chí '{row}' không hợp lệ.")

        elif q.type == QuestionType.OPEN_ENDED:
            if not isinstance(answer, str):
                errors.append(f"Câu hỏi '{q.id}' (Open Ended): câu trả lời phải là văn bản.")
            elif len(answer) > q.max_length:
                errors.append(f"Câu hỏi '{q.id}' (Open Ended): vượt quá {q.max_length} ký tự.")

    if errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "Câu trả lời không hợp lệ", "errors": errors}
        )


def _collect_open_ended_text(answers: dict, content: SurveyContent) -> str:
    """Tổng hợp nội dung các câu trả lời open_ended để tạo raw_content_text cho AI."""
    texts: list[str] = []
    for q in content.all_questions():
        if q.type == QuestionType.OPEN_ENDED:
            val = answers.get(q.id, "")
            if val and isinstance(val, str) and val.strip():
                texts.append(f"{q.label}: {val.strip()}")
    return "\n\n".join(texts)


# ── Survey CRUD ───────────────────────────────────────────────────────────────

def get_all_surveys(status: str | None) -> dict:
    data = survey_repo.list_surveys(status)
    return {"data": data, "total": len(data)}


def get_surveys_for_user(current_user: dict) -> list[dict]:
    all_published = survey_repo.list_published_surveys()
    user_roles = current_user.get("roles", [])
    
    filtered = []
    for s in all_published:
        target_config = s.get("target_config") or {}
        target_role = target_config.get("role")
        if not target_role or target_role in user_roles:
            filtered.append(s)
    return filtered


def get_survey(survey_id: int) -> dict:
    survey = survey_repo.get_survey_by_id(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return survey


def create_new_survey(data: dict, created_by: int) -> dict:
    # Validate và serialize content
    content_obj = _parse_content(data.get("content", {}))

    survey_data = {
        "title": data.get("title", "Khảo sát không tên"),
        "description": data.get("description", ""),
        "content": content_obj.model_dump(mode="json"),
        "status": data.get("status", "draft"),
        "is_anonymous": data.get("is_anonymous", True),
        "target_config": data.get("target_config", {}),
        "created_by": created_by,
    }
    return survey_repo.create_survey(survey_data)


def modify_survey(survey_id: int, data: dict) -> dict:
    existing = survey_repo.get_survey_by_id(survey_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")

    allowed_keys = ("title", "description", "content", "status", "is_anonymous", "target_config")
    update_data = {k: data[k] for k in allowed_keys if k in data}

    # Validate content nếu có cập nhật
    if "content" in update_data:
        content_obj = _parse_content(update_data["content"])
        update_data["content"] = content_obj.model_dump(mode="json")

    return survey_repo.update_survey(survey_id, update_data)


def duplicate_survey(survey_id: int, created_by: int) -> dict:
    orig = survey_repo.get_survey_by_id(survey_id)
    if not orig:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    dup_data = {
        "title": f"Bản sao của {orig['title']}",
        "description": orig["description"],
        "content": orig["content"],
        "status": "draft",
        "is_anonymous": orig["is_anonymous"],
        "target_config": orig["target_config"],
        "created_by": created_by,
    }
    return survey_repo.create_survey(dup_data)


# ── Survey Response ───────────────────────────────────────────────────────────

def submit_survey_response(survey_id: int, data: dict, user_id: int) -> dict:
    survey = survey_repo.get_survey_by_id(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")

    answers = data.get("answers", {})

    # Validate answers theo schema câu hỏi trong survey
    if survey.get("content"):
        content = _parse_content(survey["content"])
        _validate_answers(answers, content)
        # Tự động tổng hợp raw_content_text từ open_ended nếu chưa được gửi lên
        raw_text = data.get("raw_content_text", "") or _collect_open_ended_text(answers, content)
    else:
        raw_text = data.get("raw_content_text", "")

    is_anon = survey.get("is_anonymous", True)
    if not is_anon:
        if survey_repo.get_my_response(survey_id, user_id):
            raise HTTPException(status_code=400, detail="Bạn đã gửi phản hồi cho khảo sát này rồi.")
    resp_data = {
        "survey_id": survey_id,
        "user_id": None if is_anon else user_id,
        "subject_id": data.get("subject_id"),
        "answers": answers,
        "raw_content_text": raw_text,
    }
    return survey_repo.create_response(resp_data)


def get_single_response(response_id: int) -> dict:
    resp = survey_repo.get_response_by_id(response_id)
    if not resp:
        raise HTTPException(status_code=404, detail="Không tìm thấy phản hồi")
    return resp

def get_survey_analysis(survey_id: int, segment_type: str = "OVERALL", segment_value: str = "ALL") -> dict:
    """
    Lấy phân tích chi tiết kèm theo thông tin câu hỏi gốc.
    """
    # 1. Lấy thông tin khảo sát gốc để lấy tiêu đề câu hỏi
    survey = survey_repo.get_survey_by_id(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Không tìm thấy khảo sát")
    
    content = _parse_content(survey["content"])
    questions_metadata = {q.id: q for q in content.all_questions()}

    # 2. Lấy dữ liệu thống kê (từ cache stats hoặc tính mới)
    existing_stat = survey_repo.get_survey_stat(survey_id, segment_type, segment_value)
    
    if existing_stat:
        stats_data = existing_stat["question_analysis"]
        total_responses = existing_stat["total_responses"]
    else:
        # Tính toán mới nếu chưa có cache
        responses = survey_repo.list_responses_with_filters(survey_id, segment_type, segment_value)
        total_responses = len(responses)
        stats_data = _calculate_metrics(content, responses)
        
        # Lưu cache
        survey_repo.create_survey_stat({
            "survey_id": survey_id,
            "segment_type": segment_type,
            "segment_value": segment_value,
            "total_responses": total_responses,
            "question_analysis": stats_data
        })

    # 3. TRỘN DỮ LIỆU: Thống kê + Câu hỏi gốc
    enriched_analysis = {}
    for q_id, q_meta in questions_metadata.items():
        q_stats = stats_data.get(q_id, {})
        
        enriched_analysis[q_id] = {
            "question_label": q_meta.label,      # Nội dung câu hỏi: "Bạn thấy thế nào..."
            "question_type": q_meta.type,        # likert, nps...
            "required": q_meta.required,
            "stats": q_stats,                    # Dữ liệu số (distribution, average...)
        }
        
        # Bổ sung thông tin metadata riêng cho từng loại để Frontend vẽ biểu đồ
        if q_meta.type in [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE]:
            enriched_analysis[q_id]["options"] = q_meta.options
            
        elif q_meta.type == QuestionType.MATRIX:
            enriched_analysis[q_id]["rows"] = q_meta.rows
            enriched_analysis[q_id]["columns"] = q_meta.columns

    return {
        "survey_id": survey_id,
        "survey_title": survey["title"],
        "total_responses": total_responses,
        "segment": {"type": segment_type, "value": segment_value},
        "analysis": enriched_analysis
    }


def _calculate_metrics(content: SurveyContent, responses: list[dict]) -> dict:
    """Xử lý từng câu hỏi theo định dạng yêu cầu."""
    report = {}
    all_questions = content.all_questions()
    total_resps = len(responses)

    for q in all_questions:
        q_id = q.id
        # Lấy danh sách câu trả lời cho câu hỏi này
        ans_list = [r["answers"].get(q_id) for r in responses if r["answers"].get(q_id) is not None]
        
        count = len(ans_list)
        if count == 0:
            report[q_id] = {"type": q.type, "total": 0, "data": {}}
            continue

        # --- PHÂN TÍCH THEO LOẠI ---
        
        if q.type == QuestionType.LIKERT:
            dist = dict(Counter(ans_list))
            # Format: { "1": 10, "2": 20... }
            score_dist = {str(i): dist.get(i, 0) for i in range(1, 6)}
            avg = sum(ans_list) / count
            report[q_id] = {
                "type": "likert",
                "total": count,
                "average": round(avg, 2),
                "score_distribution": score_dist
            }

        elif q.type == QuestionType.NPS:
            promoters = [a for a in ans_list if a >= 9]
            detractors = [a for a in ans_list if a <= 6]
            nps_score = ((len(promoters) - len(detractors)) / count) * 100
            report[q_id] = {
                "type": "nps",
                "total": count,
                "score": round(nps_score, 2),
                "distribution": {
                    "promoters": len(promoters),
                    "passives": count - len(promoters) - len(detractors),
                    "detractors": len(detractors)
                }
            }

        elif q.type == QuestionType.SINGLE_CHOICE:
            dist = dict(Counter(ans_list))
            report[q_id] = {
                "type": "single_choice",
                "total": count,
                "distribution": {opt: dist.get(opt, 0) for opt in q.options}
            }

        elif q.type == QuestionType.MULTIPLE_CHOICE:
            # ans_list: [["A", "B"], ["A"]] -> flat_list: ["A", "B", "A"]
            flat_list = [item for sublist in ans_list for item in sublist]
            dist = dict(Counter(flat_list))
            report[q_id] = {
                "type": "multiple_choice",
                "total_respondents": count,
                "distribution": {opt: dist.get(opt, 0) for opt in q.options}
            }

        elif q.type == QuestionType.MATRIX:
            matrix_dist = {}
            for row in q.rows:
                # Lấy câu trả lời của từng hàng trong matrix
                row_ans = [a.get(row) for a in ans_list if isinstance(a, dict) and a.get(row)]
                row_counts = dict(Counter(row_ans))
                matrix_dist[row] = {col: row_counts.get(col, 0) for col in q.columns}
            
            report[q_id] = {
                "type": "matrix",
                "total": count,
                "rows_data": matrix_dist
            }

        elif q.type == QuestionType.OPEN_ENDED:
            report[q_id] = {
                "type": "open_ended",
                "total": count,
                "latest_samples": ans_list[-5:] # Trả về 5 câu trả lời gần nhất
            }

    return report