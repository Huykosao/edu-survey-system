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
    if role_ids:
        supabase_client.table("user_roles").insert([
            {"user_id": user_id, "role_id": role_id} for role_id in role_ids
        ]).execute()


def get_user_ids_by_role(role_name: str) -> list[int]:
    """Lấy danh sách user_id có role_name tương ứng."""
    result = (
        supabase_client.table("user_roles")
        .select("user_id, roles!inner(name)")
        .eq("roles.name", role_name)
        .execute()
    )
    return [ur["user_id"] for ur in result.data or []]


def get_users_roles(user_ids: list[int]) -> dict[int, list[str]]:
    """Lấy danh sách roles cho nhiều user_id trong một truy vấn duy nhất."""
    if not user_ids:
        return {}
    result = (
        supabase_client.table("user_roles")
        .select("user_id, roles(name)")
        .in_("user_id", user_ids)
        .execute()
    )

    roles_by_user: dict[int, list[str]] = {}
    for ur in result.data or []:
        user_id = ur.get("user_id")
        role_data = ur.get("roles")
        rname = ""
        if isinstance(role_data, dict):
            rname = role_data.get("name", "")
        elif isinstance(role_data, list) and role_data:
            rname = role_data[0].get("name", "")

        if user_id:
            if user_id not in roles_by_user:
                roles_by_user[user_id] = []
            if rname:
                roles_by_user[user_id].append(rname)
    return roles_by_user


def get_all_roles() -> list[dict]:
    """Lấy tất cả roles trong hệ thống."""
    result = supabase_client.table("roles").select("*").execute()
    return result.data or []

