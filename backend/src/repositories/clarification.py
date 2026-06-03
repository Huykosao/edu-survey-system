"""
repositories/clarification.py
──────────────────────────────
Truy vấn DB liên quan đến quy trình giải trình:
survey_clarifications và lecturer_responses_to_students.
"""

import datetime
from fastapi import HTTPException
from src.core.database import supabase_client


# ── Survey Clarifications ────────────────────────────────────────────────────

def create_clarification(data: dict) -> dict:
    result = supabase_client.table("survey_clarifications").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo yêu cầu giải trình thất bại")
    return result.data[0]


def list_all_clarifications() -> list[dict]:
    result = (
        supabase_client.table("survey_clarifications")
        .select("*, surveys(title), users!lecturer_id(full_name)")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def list_clarifications_for_lecturer(lecturer_id: int) -> list[dict]:
    result = (
        supabase_client.table("survey_clarifications")
        .select("*, surveys(title)")
        .eq("lecturer_id", lecturer_id)
        .execute()
    )
    return result.data or []


def update_clarification(cid: int, data: dict, lecturer_id: int | None = None) -> dict:
    data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    query = supabase_client.table("survey_clarifications").update(data).eq("id", cid)
    if lecturer_id is not None:
        query = query.eq("lecturer_id", lecturer_id)
    result = query.execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu giải trình")
    return result.data[0]


def set_clarification_status(cid: int, status: str, extra: dict | None = None) -> dict:
    data = {"status": status, **(extra or {})}
    result = supabase_client.table("survey_clarifications").update(data).eq("id", cid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu giải trình")
    return result.data[0]


# ── Lecturer Responses to Students ───────────────────────────────────────────

def create_lecturer_response(data: dict) -> dict:
    result = supabase_client.table("lecturer_responses_to_students").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo phản hồi thất bại")
    return result.data[0]


def list_pending_lecturer_responses() -> list[dict]:
    result = (
        supabase_client.table("lecturer_responses_to_students")
        .select("*, survey_clarifications(request_reason, surveys(title), users!lecturer_id(full_name))")
        .eq("is_published", False)
        .execute()
    )
    return result.data or []


def list_published_lecturer_responses() -> list[dict]:
    result = (
        supabase_client.table("lecturer_responses_to_students")
        .select("*, survey_clarifications(surveys(title), users(full_name))")
        .eq("is_published", True)
        .execute()
    )
    return result.data or []


def approve_lecturer_response(rid: int, approved_by: int) -> dict:
    result = supabase_client.table("lecturer_responses_to_students").update({
        "is_published": True,
        "approved_by": approved_by,
    }).eq("id", rid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy phản hồi")
    return result.data[0]
