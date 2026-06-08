"""
routers/users.py  (v2 — typed request/response models)
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional

from src.core.security import get_current_user
from src.core.middleware import require_admin, require_admin_or_manager
from src.models.user import (
    CreateUserRequest,
    BulkCreateUserRequest,
    UpdateUserRequest,
    UpdateUserStatusRequest,
    UpdateUserRolesRequest,
    UpdateProfileRequest,
    UpdateProfileDetailRequest,
    UserPublicResponse,
    UserListResponse,
    ProfileDetailResponse,
)
from src.models.auth import MessageResponse
from src.services.auth import create_user_service
from src.services.user import (
    get_users_list,
    get_single_user,
    update_user_info,
    get_profile,
    update_profile,
)
from src.repositories.user import (
    update_user_status,
    delete_user,
    get_profile_details,
    upsert_profile_details,
)
from src.repositories.role import get_user_roles, set_user_roles

router = APIRouter(
    prefix="/api",
    tags=["Users"],
    responses={404: {"description": "Not found"}},
)


# ── User CRUD ─────────────────────────────────────────────────────────────────

@router.get("/users", response_model=UserListResponse)
def list_users(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _: dict = Depends(require_admin_or_manager),
):
    """Danh sách users có filter và phân trang. [MANAGER, ADMIN]"""
    return get_users_list(role, status, page, limit)


@router.get("/users/{user_id}", response_model=UserPublicResponse)
def get_user(user_id: int, _: dict = Depends(require_admin_or_manager)):
    """Chi tiết một user. [MANAGER, ADMIN]"""
    return get_single_user(user_id)


@router.post("/users", response_model=UserPublicResponse)
def create_user(req: CreateUserRequest, current_user: dict = Depends(require_admin)):
    """Tạo user mới. [ADMIN]"""
    from src.repositories.user import upsert_profile_details, delete_user
    from src.core.database import supabase_client
    new_user = create_user_service(req)
    user_id = new_user["id"]
    try:
        roles = []
        if req.role_ids:
            set_user_roles(user_id, req.role_ids)
            roles = get_user_roles(user_id)
            
        profile_data = {}
        if req.phone:
            profile_data["metadata"] = {"phone": req.phone}
        if req.faculty_id:
            profile_data["faculty_id"] = req.faculty_id
        if profile_data:
            upsert_profile_details(user_id, profile_data)
            
        from src.services.user import sanitize_user
        return sanitize_user(new_user, roles)
    except Exception as e:
        try:
            supabase_client.table("user_roles").delete().eq("user_id", user_id).execute()
            supabase_client.table("profile_details").delete().eq("user_id", user_id).execute()
            delete_user(user_id)
        except Exception as cleanup_err:
            print(f"Cleanup failed for user {user_id}: {cleanup_err}")
        raise e


@router.post("/users/bulk")
def bulk_create_users(req: BulkCreateUserRequest, _: dict = Depends(require_admin)):
    """Tạo nhiều user cùng lúc từ file Excel. [ADMIN]"""
    from src.services.auth import create_user_service
    from src.repositories.role import set_user_roles
    from src.core.database import supabase_client
    from src.repositories.user import upsert_profile_details, delete_user
    
    fac_res = supabase_client.table("faculties").select("id, name").execute()
    faculties_map = {}
    if fac_res.data:
        for f in fac_res.data:
            if f.get("name"):
                faculties_map[f["name"].strip().lower()] = f["id"]
    
    success_count = 0
    errors = []
    for idx, user_req in enumerate(req.users):
        user_id = None
        try:
            profile_data = {}
            if user_req.phone:
                profile_data["metadata"] = {"phone": user_req.phone}
                
            if user_req.faculty_id:
                profile_data["faculty_id"] = user_req.faculty_id
            elif user_req.faculty_name:
                fname_lower = user_req.faculty_name.lower().strip()
                if fname_lower in faculties_map:
                    profile_data["faculty_id"] = faculties_map[fname_lower]
                else:
                    raise ValueError(f"Khoa '{user_req.faculty_name}' không tồn tại trong hệ thống")

            new_user = create_user_service(user_req)
            user_id = new_user["id"]
            if user_req.role_ids:
                set_user_roles(user_id, user_req.role_ids)

            if profile_data:
                upsert_profile_details(user_id, profile_data)
                
            success_count += 1
        except Exception as e:
            if user_id is not None:
                try:
                    supabase_client.table("user_roles").delete().eq("user_id", user_id).execute()
                    supabase_client.table("profile_details").delete().eq("user_id", user_id).execute()
                    delete_user(user_id)
                except Exception as cleanup_err:
                    print(f"Cleanup failed for user {user_id}: {cleanup_err}")
                    
            # Extract error message
            err_msg = str(e)
            if hasattr(e, "detail"):
                err_msg = e.detail
            elif "duplicate key" in str(e).lower() or "already exists" in str(e).lower():
                err_msg = "Email hoặc tài khoản đã tồn tại"
            errors.append({"email": user_req.email, "error": err_msg})
            
    return {
        "success_count": success_count,
        "total_count": len(req.users),
        "errors": errors,
        "message": f"Đã tạo thành công {success_count} trên tổng số {len(req.users)} người dùng."
    }


@router.put("/users/{user_id}", response_model=MessageResponse)
def update_user(user_id: int, req: UpdateUserRequest, _: dict = Depends(require_admin)):
    """Cập nhật thông tin và/hoặc roles của user. [ADMIN]"""
    return update_user_info(user_id, req.model_dump(exclude_unset=True))


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user_endpoint(user_id: int, _: dict = Depends(require_admin)):
    """Xóa user. [ADMIN]"""
    delete_user(user_id)
    return {"message": "Xóa người dùng thành công"}


@router.patch("/users/{user_id}/status", response_model=UserPublicResponse)
def change_user_status(
    user_id: int,
    req: UpdateUserStatusRequest,
    _: dict = Depends(require_admin),
):
    """Khóa / mở khóa tài khoản user. [ADMIN]"""
    updated_user = update_user_status(user_id, req.status)
    roles = get_user_roles(user_id)
    from src.services.user import sanitize_user
    return sanitize_user(updated_user, roles)


# ── User Roles ────────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/roles")
def get_roles_of_user(user_id: int, _: dict = Depends(require_admin)):
    """Lấy roles của một user. [ADMIN]"""
    return {"roles": get_user_roles(user_id)}


@router.put("/users/{user_id}/roles", response_model=MessageResponse)
def update_roles_of_user(
    user_id: int,
    req: UpdateUserRolesRequest,
    _: dict = Depends(require_admin),
):
    """Thay thế toàn bộ roles của user. [ADMIN]"""
    set_user_roles(user_id, req.role_ids)
    return {"message": "Cập nhật quyền thành công"}


# ── Profile (bản thân) ────────────────────────────────────────────────────────

@router.get("/profile", response_model=UserPublicResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Xem profile bản thân. [Mọi user đã đăng nhập]"""
    return get_profile(current_user)


@router.put("/profile", response_model=MessageResponse)
def update_my_profile(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    """Cập nhật profile bản thân. [Mọi user đã đăng nhập]"""
    return update_profile(current_user, req.model_dump(exclude_none=True))


@router.get("/profile/details", response_model=ProfileDetailResponse)
def get_my_profile_details(current_user: dict = Depends(get_current_user)):
    """Xem chi tiết profile. [Mọi user đã đăng nhập]"""
    return get_profile_details(current_user["id"]) or {}


@router.put("/profile/details", response_model=MessageResponse)
def update_my_profile_details(
    req: UpdateProfileDetailRequest,
    current_user: dict = Depends(get_current_user),
):
    """Cập nhật chi tiết profile. [Mọi user đã đăng nhập]"""
    upsert_profile_details(current_user["id"], req.model_dump(exclude_none=True))
    return {"message": "Cập nhật thành công"}
