"""
routers/auth.py
────────────────
Router xác thực: login, logout, me, đổi mật khẩu.
Chỉ xử lý HTTP request/response — business logic nằm ở services.
"""

from fastapi import APIRouter, Depends, HTTPException

from src.models.auth import LoginRequest, ChangePasswordRequest
from pydantic import BaseModel, EmailStr
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

    stored_hash = user.get("password_hash", "")
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode("utf-8")

    if not verify_password(login_req.password, stored_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    if user.get("status") == "locked":
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa. Liên hệ Admin để mở khóa.")

    roles = get_user_roles(user["id"])
    update_last_login(user["id"])
    
    from src.core.security import create_refresh_token
    access_token = create_access_token(user["id"], user["email"], roles)
    refresh_token = create_refresh_token(user["id"])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
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



class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh-token")
def refresh_token(req: RefreshTokenRequest):
    """Sử dụng refresh_token để lấy access_token mới."""
    try:
        from src.core.security import decode_token, create_access_token, create_refresh_token
        from src.repositories.user import get_user_by_id
        from src.repositories.role import get_user_roles
        
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Loại token không hợp lệ")
            
        user_id = int(payload.get("sub") or 0)
        if not user_id:
            raise HTTPException(status_code=401, detail="Token không hợp lệ")
            
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Người dùng không tồn tại")
        if user.get("status") == "locked":
            raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")
            
        roles = get_user_roles(user_id)
        access_token = create_access_token(user_id, user["email"], roles)
        new_refresh_token = create_refresh_token(user_id)
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    """Tạo mật khẩu ngẫu nhiên và gửi qua email."""
    from src.repositories.user import get_user_by_email, update_password_hash
    import random
    import string
    
    user = get_user_by_email(req.email)
    if not user:
        # Prevent email enumeration
        return {"message": "Nếu email hợp lệ, mật khẩu mới sẽ được gửi đến hộp thư của bạn."}
        
    # Generate random 8-char password
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    new_password = "".join(random.choice(characters) for i in range(8))
    
    # Save the new password
    new_hash = hash_password(new_password)
    update_password_hash(
        user["id"],
        new_hash.decode("utf-8") if isinstance(new_hash, bytes) else new_hash,
    )
    
    # Simulate sending email
    print("="*40)
    print(f"[SIMULATED EMAIL TO {req.email}]")
    print(f"Subject: Đặt lại mật khẩu")
    print(f"Mật khẩu mới của bạn là: {new_password}")
    print(f"Vui lòng đăng nhập và đổi lại mật khẩu ngay lập tức.")
    print("="*40)
    
    return {"message": "Nếu email hợp lệ, mật khẩu mới sẽ được gửi đến hộp thư của bạn."}