"""
repositories/role.py
────────────────────
Tất cả truy vấn DB liên quan đến roles và user_roles.
"""

from src.core.database import supabase_client


def get_user_roles(user_id: int) -> list[str]:
    """Lấy danh sách tên role của user theo user_id."""
    result = (
        supabase_client.table("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", user_id)
        .execute()
    )

    roles: list[str] = []
    for ur in result.data or []:
        role_data = ur.get("roles")
        if isinstance(role_data, dict):
            roles.append(role_data.get("name", ""))
        elif isinstance(role_data, list) and role_data:
            roles.append(role_data[0].get("name", ""))
    return roles


def set_user_roles(user_id: int, role_ids: list[int]) -> None:
    """Thay thế toàn bộ roles của user."""
    supabase_client.table("user_roles").delete().eq("user_id", user_id).execute()
    for role_id in role_ids:
        supabase_client.table("user_roles").insert(
            {"user_id": user_id, "role_id": role_id}
        ).execute()


def get_all_roles() -> list[dict]:
    """Lấy tất cả roles trong hệ thống."""
    result = supabase_client.table("roles").select("*").execute()
    return result.data or []
