"""
routers/auth.py
────────────────
Router xác thực: login, logout, me, đổi mật khẩu.
Chỉ xử lý HTTP request/response — business logic nằm ở services.
"""

from fastapi import APIRouter, Depends, HTTPException

from src.models.auth import LoginRequest, ChangePasswordRequest
from src.core.security import get_current_user, create_access_token
from src.services.auth import verify_password, hash_password
from src.services.user import sanitize_user, get_profile
from src.repositories.user import (
    get_user_by_email,
    update_last_login,
    update_password_hash,
)
from src.repositories.role import get_user_roles

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
    responses={404: {"description": "Not found"}},
)


@router.post("/login")
def login(login_req: LoginRequest):
    """Đăng nhập bằng email + password. Trả về access_token và thông tin user."""
    user = get_user_by_email(login_req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    if user.get("status") == "locked":
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa. Liên hệ Admin để mở khóa.")

    stored_hash = user.get("password_hash", "")
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode("utf-8")

    if not verify_password(login_req.password, stored_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    roles = get_user_roles(user["id"])
    update_last_login(user["id"])
    access_token = create_access_token(user["id"], user["email"], roles)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": sanitize_user(user, roles),
    }


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Đăng xuất — phía client hủy token."""
    return {"message": "Đăng xuất thành công"}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Lấy thông tin user hiện tại."""
    return get_profile(current_user)


@router.put("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    """Đổi mật khẩu cho user hiện tại."""
    stored_hash = current_user.get("password_hash", "")
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode("utf-8")

    if not verify_password(req.current_password, stored_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự")

    new_hash = hash_password(req.new_password)
    update_password_hash(
        current_user["id"],
        new_hash.decode("utf-8") if isinstance(new_hash, bytes) else new_hash,
    )
    return {"message": "Đổi mật khẩu thành công"}


@router.post("/refresh-token")
def refresh_token():
    """Refresh token — chưa triển khai."""
    raise HTTPException(status_code=501, detail="Chức năng refresh token chưa được triển khai")