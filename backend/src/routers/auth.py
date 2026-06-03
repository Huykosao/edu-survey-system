from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.models.auth import LoginRequest, ChangePasswordRequest
from src.services.auth import hash_password, verify_password
from src.core.database import supabase_client
import jwt
import datetime
import os

SECRET_KEY = os.environ.get("JWT_SECRET", "edu-survey-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer(auto_error=False)

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
    responses={404: {"description": "Not found"}}
)


def create_access_token(user_id: int, email: str, roles: list[str]) -> str:
    """Generate a JWT access token."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "roles": roles,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.datetime.now(datetime.timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token đã hết hạn")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to extract the current authenticated user from token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")
    
    payload = decode_token(credentials.credentials)
    user_id = int(payload.get("sub", 0))
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    
    # Fetch user from DB
    result = supabase_client.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Người dùng không tồn tại")
    
    user = result.data[0]
    if user.get("status") == "locked":
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")
    
    return user


def get_user_roles(user_id: int) -> list[str]:
    """Get role names for a user."""
    result = supabase_client.table("user_roles").select(
        "role_id, roles(name)"
    ).eq("user_id", user_id).execute()
    
    roles = []
    for ur in (result.data or []):
        role_data = ur.get("roles")
        if role_data and isinstance(role_data, dict):
            roles.append(role_data.get("name", ""))
        elif role_data and isinstance(role_data, list) and len(role_data) > 0:
            roles.append(role_data[0].get("name", ""))
    return roles


def sanitize_user(user: dict, roles: list[str]) -> dict:
    """Return user data without sensitive fields."""
    return {
        "id": user.get("id"),
        "username": user.get("username"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "status": user.get("status"),
        "roles": roles,
        "last_login": user.get("last_login"),
        "created_at": user.get("created_at"),
    }


@router.get("/test")
def test():
    return {"Test": "Success"}


@router.post("/login")
def login(login_req: LoginRequest):
    """
    Authenticate user by email + password.
    Returns access_token and user info.
    """
    # Find user by email
    result = supabase_client.table("users").select("*").eq("email", login_req.email).execute()
    
    if not result.data:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    user = result.data[0]
    
    # Check account status
    if user.get("status") == "locked":
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa. Liên hệ Admin để mở khóa.")
    
    # Verify password
    stored_hash = user.get("password_hash", "")
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode("utf-8")
    
    if not verify_password(login_req.password, stored_hash):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    # Get user roles
    roles = get_user_roles(user["id"])
    
    # Update last_login
    supabase_client.table("users").update({
        "last_login": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }).eq("id", user["id"]).execute()
    
    # Generate token
    access_token = create_access_token(user["id"], user["email"], roles)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": sanitize_user(user, roles),
    }


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout — invalidate token (client-side).
    In a more advanced setup, add token to a blacklist.
    """
    return {"message": "Đăng xuất thành công"}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get the currently authenticated user's information.
    """
    roles = get_user_roles(current_user["id"])
    return sanitize_user(current_user, roles)


@router.put("/change-password")
def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """
    Change the current user's password.
    """
    # Verify current password
    stored_hash = current_user.get("password_hash", "")
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode("utf-8")
    
    if not verify_password(req.current_password, stored_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự")
    
    # Hash new password
    new_hash = hash_password(req.new_password)
    
    # Update in DB
    supabase_client.table("users").update({
        "password_hash": new_hash.decode("utf-8") if isinstance(new_hash, bytes) else new_hash,
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }).eq("id", current_user["id"]).execute()
    
    return {"message": "Đổi mật khẩu thành công"}


@router.post("/refresh-token")
def refresh_token():
    """
    Refresh token endpoint — simplified version.
    In production, use proper refresh token rotation.
    """
    raise HTTPException(status_code=501, detail="Chức năng refresh token chưa được triển khai")