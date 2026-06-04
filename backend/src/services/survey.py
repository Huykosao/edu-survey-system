"""
services/survey.py
───────────────────
Business logic cho quản lý survey và survey responses.
Bao gồm validation cấu trúc content (SurveyContent) và answers khi submit.
"""

from fastapi import HTTPException
from src.repositories import survey as survey_repo
from src.schemas.survey import SurveyContent, QuestionType


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
