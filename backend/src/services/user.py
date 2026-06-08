"""
services/user.py
─────────────────
Business logic cho quản lý user: build sanitized response, phân trang, v.v.
"""

from src.repositories.user import (
    list_users,
    get_user_by_id,
    update_user,
    update_user_status,
    delete_user,
    get_profile_details,
    upsert_profile_details,
)
from src.repositories.role import (
    get_user_roles,
    set_user_roles,
    get_user_ids_by_role,
    get_users_roles,
)
from fastapi import HTTPException


def sanitize_user(user: dict, roles: list[str]) -> dict:
    """Trả về user data đã loại bỏ thông tin nhạy cảm."""
    return {
        "id": user.get("id"),
        "username": user.get("username"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "status": user.get("status"),
        "roles": roles,
        "last_login": user.get("last_login"),
        "created_at": user.get("created_at"),
        "phone": user.get("phone"),
        "faculty_id": user.get("faculty_id"),
        "faculty_name": user.get("faculty_name"),
    }


def get_users_list(role_filter: str | None, status: str | None, page: int, limit: int) -> dict:
    """Lấy danh sách users có filter và phân trang."""
    user_ids = None
    if role_filter:
        user_ids = get_user_ids_by_role(role_filter)
        if not user_ids:
            return {"data": [], "total": 0}

    users_raw, total = list_users(status, page, limit, user_ids=user_ids)

    # N+1 query fix: fetch all roles in one query
    retrieved_user_ids = [u["id"] for u in users_raw]
    roles_by_user = get_users_roles(retrieved_user_ids)
    
    from src.repositories.user import get_profiles_by_user_ids
    profiles_by_user = get_profiles_by_user_ids(retrieved_user_ids)

    users_with_roles = []
    for u in users_raw:
        roles = roles_by_user.get(u["id"], [])
        profile = profiles_by_user.get(u["id"], {})
        u["phone"] = profile.get("phone")
        u["faculty_id"] = profile.get("faculty_id")
        u["faculty_name"] = profile.get("faculty_name")
        users_with_roles.append(sanitize_user(u, roles))

    return {"data": users_with_roles, "total": total}


def get_single_user(user_id: int) -> dict:
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    roles = get_user_roles(user_id)
    
    from src.repositories.user import get_profiles_by_user_ids
    profile = get_profiles_by_user_ids([user_id]).get(user_id, {})
    user["phone"] = profile.get("phone")
    user["faculty_id"] = profile.get("faculty_id")
    user["faculty_name"] = profile.get("faculty_name")
    
    return sanitize_user(user, roles)


def update_user_info(user_id: int, data: dict) -> dict:
    """Cập nhật thông tin user và roles (nếu có)."""
    update_data = {}
    if "full_name" in data:
        update_data["full_name"] = data["full_name"]
    if "status" in data:
        update_data["status"] = data["status"]
    if update_data:
        update_user(user_id, update_data)
        
    if "role_ids" in data:
        set_user_roles(user_id, data["role_ids"])
        
    profile_data = {}
    from src.repositories.user import get_profile_details, upsert_profile_details
    existing_profile = get_profile_details(user_id) or {}
    
    if "phone" in data:
        metadata = existing_profile.get("metadata") or {}
        if data["phone"] is None:
            metadata.pop("phone", None)
        else:
            metadata["phone"] = data["phone"]
        profile_data["metadata"] = metadata
        
    if "faculty_id" in data:
        profile_data["faculty_id"] = data["faculty_id"]
        
    if profile_data:
        upsert_profile_details(user_id, profile_data)
        
    return {"message": "Cập nhật thành công"}


def get_profile(current_user: dict) -> dict:
    roles = current_user.get("roles", [])
    return sanitize_user(current_user, roles)


def update_profile(current_user: dict, data: dict) -> dict:
    allowed = {"full_name"}
    update_data = {k: v for k, v in data.items() if k in allowed}
    if update_data:
        update_user(current_user["id"], update_data)
    return {"message": "Cập nhật thành công"}
