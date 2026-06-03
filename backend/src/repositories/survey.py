"""
repositories/survey.py
──────────────────────
Toàn bộ truy vấn DB liên quan đến bảng surveys và survey_responses.
"""

from fastapi import HTTPException
from src.core.database import supabase_client


# ── Surveys ───────────────────────────────────────────────────────────────────

def list_surveys(status: str | None = None) -> list[dict]:
    query = supabase_client.table("surveys").select("*")
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


def get_survey_by_id(survey_id: int) -> dict | None:
    result = supabase_client.table("surveys").select("*").eq("id", survey_id).execute()
    return result.data[0] if result.data else None


def create_survey(survey_data: dict) -> dict:
    result = supabase_client.table("surveys").insert(survey_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo khảo sát thất bại")
    return result.data[0]


def update_survey(survey_id: int, update_data: dict) -> dict:
    result = supabase_client.table("surveys").update(update_data).eq("id", survey_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return result.data[0]


def delete_survey(survey_id: int) -> None:
    supabase_client.table("surveys").delete().eq("id", survey_id).execute()


def update_survey_status(survey_id: int, status: str) -> dict:
    result = supabase_client.table("surveys").update({"status": status}).eq("id", survey_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return result.data[0]


def list_published_surveys() -> list[dict]:
    result = supabase_client.table("surveys").select("*").eq("status", "published").execute()
    return result.data or []


# ── Survey Responses ──────────────────────────────────────────────────────────

def create_response(resp_data: dict) -> dict:
    result = supabase_client.table("survey_responses").insert(resp_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Gửi phản hồi thất bại")
    return result.data[0]


def get_my_response(survey_id: int, user_id: int) -> dict | None:
    result = (
        supabase_client.table("survey_responses")
        .select("*")
        .eq("survey_id", survey_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None


def list_responses_by_survey(survey_id: int) -> list[dict]:
    result = (
        supabase_client.table("survey_responses")
        .select("*, users(full_name)")
        .eq("survey_id", survey_id)
        .execute()
    )
    return result.data or []


def get_response_by_id(response_id: int) -> dict | None:
    result = (
        supabase_client.table("survey_responses")
        .select("*")
        .eq("id", response_id)
        .execute()
    )
    return result.data[0] if result.data else None
