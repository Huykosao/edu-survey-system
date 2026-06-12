"""
repositories/improvement.py
────────────────────────────
Truy vấn DB liên quan đến bảng improvement_announcements.
"""

from fastapi import HTTPException
from src.core.database import supabase_client


def create_improvement(data: dict) -> dict:
    result = supabase_client.table("improvement_announcements").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo thông báo cải tiến thất bại")
    return result.data[0]


def list_improvements() -> list[dict]:
    result = (
        supabase_client.table("improvement_announcements")
        .select("*, surveys(title)")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def get_improvement_by_id(iid: int) -> dict | None:
    result = (
        supabase_client.table("improvement_announcements")
        .select("*, surveys(title)")
        .eq("id", iid)
        .execute()
    )
    return result.data[0] if result.data else None

