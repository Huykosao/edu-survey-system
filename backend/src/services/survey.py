"""
services/survey.py
───────────────────
Business logic cho quản lý survey và survey responses.
Hỗ trợ phân tích thống kê chi tiết và xử lý an toàn dữ liệu đồng thời.
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
    """Validate answers theo schema từng câu hỏi."""
    questions = content.all_questions()
    errors: list[str] = []

    for q in questions:
        answer = answers.get(q.id)

        if q.required and (answer is None or answer == "" or answer == [] or answer == {}):
            errors.append(f"Câu hỏi '{q.id}' là bắt buộc nhưng chưa có câu trả lời.")
            continue

        if answer is None:
            continue

        # Validate theo từng loại
        if q.type == QuestionType.LIKERT:
            if not isinstance(answer, int) or not (1 <= answer <= 5):
                errors.append(f"Câu hỏi '{q.id}' (Likert): phải từ 1-5.")

        elif q.type == QuestionType.NPS:
            if not isinstance(answer, int) or not (0 <= answer <= 10):
                errors.append(f"Câu hỏi '{q.id}' (NPS): phải từ 0-10.")

        elif q.type == QuestionType.SINGLE_CHOICE:
            if answer not in q.options:
                errors.append(f"Câu hỏi '{q.id}': Lựa chọn không hợp lệ.")

        elif q.type == QuestionType.MULTIPLE_CHOICE:
            if not isinstance(answer, list):
                errors.append(f"Câu hỏi '{q.id}': Phải là danh sách.")
            else:
                if q.max_selections and len(answer) > q.max_selections:
                    errors.append(f"Câu hỏi '{q.id}': Tối đa {q.max_selections} lựa chọn.")

        elif q.type == QuestionType.MATRIX:
            if not isinstance(answer, dict):
                errors.append(f"Câu hỏi '{q.id}': Phải là object {{row: column}}.")

        elif q.type == QuestionType.OPEN_ENDED:
            if not isinstance(answer, str):
                errors.append(f"Câu hỏi '{q.id}': Phải là văn bản.")

    if errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "Câu trả lời không hợp lệ", "errors": errors}
        )


def _collect_open_ended_text(answers: dict, content: SurveyContent) -> str:
    """Tổng hợp nội dung các câu trả lời open_ended để AI xử lý."""
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


def get_survey(survey_id: int) -> dict:
    survey = survey_repo.get_survey_by_id(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return survey


def create_new_survey(data: dict, created_by: int) -> dict:
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
    existing = get_survey(survey_id)
    allowed_keys = ("title", "description", "content", "status", "is_anonymous", "target_config")
    update_data = {k: data[k] for k in allowed_keys if k in data}

    if "content" in update_data:
        content_obj = _parse_content(update_data["content"])
        update_data["content"] = content_obj.model_dump(mode="json")

    return survey_repo.update_survey(survey_id, update_data)


def get_surveys_for_user(current_user: dict) -> list[dict]:
    """Lấy danh sách khảo sát published mà user có thể làm."""
    return survey_repo.list_published_surveys()


def duplicate_survey(survey_id: int, created_by: int) -> dict:
    """Nhân bản một khảo sát."""
    original = get_survey(survey_id)
    new_data = {
        "title": f"{original['title']} (Bản sao)",
        "description": original.get("description", ""),
        "content": original.get("content", {}),
        "status": "draft",
        "is_anonymous": original.get("is_anonymous", True),
        "target_config": original.get("target_config", {}),
        "created_by": created_by,
    }
    return survey_repo.create_survey(new_data)


def get_single_response(response_id: int) -> dict:
    """Lấy chi tiết một phản hồi."""
    resp = survey_repo.get_response_by_id(response_id)
    if not resp:
        raise HTTPException(status_code=404, detail="Không tìm thấy phản hồi")
    return resp


# ── Survey Response & Analytics ───────────────────────────────────────────────

def submit_survey_response(survey_id: int, data: dict, user_id: int) -> dict:
    survey = get_survey(survey_id)
    answers = data.get("answers", {})

    if survey.get("content"):
        content = _parse_content(survey["content"])
        _validate_answers(answers, content)
        raw_text = data.get("raw_content_text", "") or _collect_open_ended_text(answers, content)
    else:
        raw_text = data.get("raw_content_text", "")

    # Check duplicate
    if not survey.get("is_anonymous", True):
        if survey_repo.get_my_response(survey_id, user_id):
            raise HTTPException(status_code=400, detail="Bạn đã gửi phản hồi cho khảo sát này rồi.")

    resp_data = {
        "survey_id": survey_id,
        "user_id": None if survey.get("is_anonymous", True) else user_id,
        "subject_id": data.get("subject_id"),
        "answers": answers,
        "raw_content_text": raw_text,
    }
    
    new_response = survey_repo.create_response(resp_data)

    # CHIẾN LƯỢC: Cache Invalidation
    # Xóa thống kê cũ để lần gọi analysis tiếp theo sẽ tính toán lại dữ liệu mới nhất
    # Điều này an toàn tuyệt đối trong môi trường đồng thời cao
    survey_repo.delete_survey_stats(survey_id)

    return new_response


def get_survey_analysis(survey_id: int, segment_type: str = "OVERALL", segment_value: str = "ALL") -> dict:
    """Lấy báo cáo phân tích. Thống nhất schema dù lấy từ cache hay tính mới."""
    survey = get_survey(survey_id)
    existing_stat = survey_repo.get_survey_stat(survey_id, segment_type, segment_value)
    
    if existing_stat:
        stats_data = existing_stat["question_analysis"]
        total_responses = existing_stat["total_responses"]
    else:
        # Tính toán lại từ đầu
        responses = survey_repo.list_responses_with_filters(survey_id, segment_type, segment_value)
        total_responses = len(responses)
        content = _parse_content(survey["content"])
        stats_data = _calculate_metrics(content, responses)
        
        # Cập nhật cache
        survey_repo.create_survey_stat({
            "survey_id": survey_id,
            "segment_type": segment_type,
            "segment_value": segment_value,
            "total_responses": total_responses,
            "question_analysis": stats_data
        })

    return _format_analysis_response(survey, total_responses, stats_data, segment_type, segment_value)


def _calculate_metrics(content: SurveyContent, responses: list[dict]) -> dict:
    """Tính toán toán học cho từng loại câu hỏi."""
    report = {}
    for q in content.all_questions():
        ans_list = [r["answers"].get(q.id) for r in responses if r["answers"].get(q.id) is not None]
        count = len(ans_list)
        
        if count == 0:
            report[q.id] = {"type": q.type, "total": 0}
            continue

        if q.type == QuestionType.LIKERT:
            dist = dict(Counter(ans_list))
            report[q.id] = {
                "total": count,
                "average": round(sum(ans_list) / count, 2),
                "score_distribution": {str(i): dist.get(i, 0) for i in range(1, 6)}
            }
        elif q.type == QuestionType.NPS:
            promoters = len([a for a in ans_list if a >= 9])
            detractors = len([a for a in ans_list if a <= 6])
            report[q.id] = {
                "total": count,
                "score": round(((promoters - detractors) / count) * 100, 2),
                "distribution": {"promoters": promoters, "detractors": detractors, "passives": count - promoters - detractors}
            }
        elif q.type in [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE]:
            flat_list = [item for sub in ans_list for item in (sub if isinstance(sub, list) else [sub])]
            report[q.id] = {"total": count, "distribution": dict(Counter(flat_list))}
        elif q.type == QuestionType.MATRIX:
            matrix_dist = {}
            for row in q.rows:
                row_ans = [a.get(row) for a in ans_list if isinstance(a, dict) and a.get(row)]
                matrix_dist[row] = dict(Counter(row_ans))
            report[q.id] = {"total": count, "rows_data": matrix_dist}
        elif q.type == QuestionType.OPEN_ENDED:
            report[q.id] = {"total": count, "latest_samples": ans_list[-10:]}

    return report


def _format_analysis_response(survey: dict, total: int, stats: dict, seg_type: str, seg_val: str) -> dict:
    """Hàm duy nhất định nghĩa cấu trúc dữ liệu trả về cho Frontend."""
    content = _parse_content(survey["content"])
    enriched = {}
    for q in content.all_questions():
        q_stats = stats.get(q.id, {})
        enriched[q.id] = {
            "question_label": q.label,
            "question_type": q.type,
            "required": q.required,
            "options": getattr(q, 'options', None),
            "rows": getattr(q, 'rows', None),
            "columns": getattr(q, 'columns', None),
            "stats": q_stats
        }

    return {
        "survey_id": survey["id"],
        "survey_title": survey["title"],
        "total_responses": total,
        "segment": {"type": seg_type, "value": seg_val},
        "analysis": enriched
    }