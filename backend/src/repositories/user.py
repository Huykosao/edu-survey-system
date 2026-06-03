"""
repositories/user.py
────────────────────
Toàn bộ truy vấn DB liên quan đến bảng users và profile_details.
"""

import datetime
from fastapi import HTTPException
from src.core.database import supabase_client
from src.schemas.user import NewUserRow


# ── Users ─────────────────────────────────────────────────────────────────────

def create_user(new_user: NewUserRow) -> dict:
    res = (
        supabase_client.table("users")
        .insert(new_user.model_dump(mode="json", exclude_none=True))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=500, detail="Tạo người dùng thất bại")
    return res.data[0]


def get_user_by_id(user_id: int) -> dict | None:
    result = supabase_client.table("users").select("*").eq("id", user_id).execute()
    return result.data[0] if result.data else None


def get_user_by_email(email: str) -> dict | None:
    result = supabase_client.table("users").select("*").eq("email", email).execute()
    return result.data[0] if result.data else None


def list_users(
    status: str | None, 
    page: int, 
    limit: int, 
    user_ids: list[int] | None = None
) -> tuple[list[dict], int]:
    query = supabase_client.table("users").select("*", count="exact")
    if status:
        query = query.eq("status", status)
    if user_ids is not None:
        query = query.in_("id", user_ids)
    offset = (page - 1) * limit
    result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
    return result.data or [], result.count or 0


def update_user(user_id: int, update_data: dict) -> dict:
    update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    result = (
        supabase_client.table("users").update(update_data).eq("id", user_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return result.data[0]


def update_user_status(user_id: int, status: str) -> dict:
    result = supabase_client.table("users").update({
        "status": status,
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return result.data[0]


def delete_user(user_id: int) -> None:
    result = supabase_client.table("users").delete().eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")


def update_last_login(user_id: int) -> None:
    supabase_client.table("users").update({
        "last_login": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }).eq("id", user_id).execute()


def update_password_hash(user_id: int, new_hash: str) -> None:
    supabase_client.table("users").update({
        "password_hash": new_hash,
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }).eq("id", user_id).execute()


# ── Profile Details ───────────────────────────────────────────────────────────

def get_profile_details(user_id: int) -> dict | None:
    result = (
        supabase_client.table("profile_details")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None


def upsert_profile_details(user_id: int, data: dict) -> None:
    data.pop("user_id", None)
    existing = (
        supabase_client.table("profile_details")
        .select("user_id")
        .eq("user_id", user_id)
        .execute()
    )
    if existing.data:
        supabase_client.table("profile_details").update(data).eq("user_id", user_id).execute()
    else:
        supabase_client.table("profile_details").insert({**data, "user_id": user_id}).execute()