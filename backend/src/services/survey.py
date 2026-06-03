"""
services/survey.py
───────────────────
Business logic cho quản lý survey và survey responses.
"""

from fastapi import HTTPException
from src.repositories import survey as survey_repo


def get_all_surveys(status: str | None) -> dict:
    data = survey_repo.list_surveys(status)
    return {"data": data, "total": len(data)}


def get_survey(survey_id: int) -> dict:
    survey = survey_repo.get_survey_by_id(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return survey


def create_new_survey(data: dict, created_by: int) -> dict:
    survey_data = {
        "title": data.get("title", "Khảo sát không tên"),
        "description": data.get("description", ""),
        "content": data.get("content", {}),
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


def submit_survey_response(survey_id: int, data: dict, user_id: int) -> dict:
    survey = survey_repo.get_survey_by_id(survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    is_anon = survey.get("is_anonymous", True)
    resp_data = {
        "survey_id": survey_id,
        "user_id": None if is_anon else user_id,
        "subject_id": data.get("subject_id"),
        "answers": data.get("answers", {}),
        "raw_content_text": data.get("raw_content_text", ""),
    }
    return survey_repo.create_response(resp_data)


def get_single_response(response_id: int) -> dict:
    resp = survey_repo.get_response_by_id(response_id)
    if not resp:
        raise HTTPException(status_code=404, detail="Không tìm thấy phản hồi")
    return resp
