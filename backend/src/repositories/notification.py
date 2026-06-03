"""
repositories/notification.py
─────────────────────────────
Truy vấn DB liên quan đến bảng notifications.
"""

from src.core.database import supabase_client


def list_notifications(recipient_id: int) -> list[dict]:
    result = (
        supabase_client.table("notifications")
        .select("*")
        .eq("recipient_id", recipient_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data or []


def list_unread_notifications(recipient_id: int) -> list[dict]:
    result = (
        supabase_client.table("notifications")
        .select("*")
        .eq("recipient_id", recipient_id)
        .eq("is_read", False)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def mark_notification_read(nid: int, recipient_id: int) -> None:
    supabase_client.table("notifications").update({"is_read": True}).eq("id", nid).eq(
        "recipient_id", recipient_id
    ).execute()


def mark_all_read(recipient_id: int) -> None:
    supabase_client.table("notifications").update({"is_read": True}).eq(
        "recipient_id", recipient_id
    ).eq("is_read", False).execute()


def create_notification(data: dict) -> dict:
    result = supabase_client.table("notifications").insert(data).execute()
    return result.data[0] if result.data else {}
