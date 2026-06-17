"""
routers/auth.py
────────────────
Router xác thực: login, logout, me, đổi mật khẩu.
Chỉ xử lý HTTP request/response — business logic nằm ở services.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from src.core.limiter import limiter

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
@limiter.limit("10/minute")
def login(login_req: LoginRequest, request: Request):
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
    # Lấy password_hash trực tiếp từ DB (get_current_user không trả về trường này)
    from src.core.database import supabase_client
    user_row = supabase_client.table("users").select("password_hash").eq("id", current_user["id"]).execute()
    if not user_row.data:
        raise HTTPException(status_code=401, detail="Người dùng không tồn tại")
    
    stored_hash = user_row.data[0].get("password_hash", "")
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode("utf-8")

    if not verify_password(req.current_password, stored_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự")

    import re
    if not re.search(r'[A-Z]', req.new_password):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải chứa ít nhất 1 chữ hoa")
    if not re.search(r'[0-9]', req.new_password):
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải chứa ít nhất 1 chữ số")

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
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(req: ForgotPasswordRequest, request: Request, background_tasks: BackgroundTasks):
    """Tạo mật khẩu ngẫu nhiên mạnh và gửi qua email."""
    import secrets
    import string
    
    user = get_user_by_email(req.email)
    if not user:
        # Prevent email enumeration
        return {"message": "Nếu email hợp lệ, mật khẩu mới sẽ được gửi đến hộp thư của bạn."}
        
    # Tạo mật khẩu ngẫu nhiên mạnh (12 ký tự, đầy đủ chữ hoa, chữ thường, số, ký tự đặc biệt)
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*"
    all_chars = lowercase + uppercase + digits + special
    
    pwd_list = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special)
    ]
    pwd_list += [secrets.choice(all_chars) for _ in range(8)]
    import random
    random.SystemRandom().shuffle(pwd_list)
    new_password = "".join(pwd_list)
    
    # Save the new password
    new_hash = hash_password(new_password)
    update_password_hash(
        user["id"],
        new_hash.decode("utf-8") if isinstance(new_hash, bytes) else new_hash,
    )
    
    # Gửi email qua background task
    from src.services.email import send_password_reset_email
    background_tasks.add_task(send_password_reset_email, req.email, new_password)
    
    return {"message": "Nếu email hợp lệ, mật khẩu mới sẽ được gửi đến hộp thư của bạn."}