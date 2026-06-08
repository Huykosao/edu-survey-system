"""
core/security.py
────────────────
JWT helpers và FastAPI dependency `get_current_user`.
Tất cả logic xác thực token được tập trung ở đây,
không nằm rải rác trong các router.
"""

import os
import datetime
import jwt

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.core.database import supabase_client

# ── Constants ────────────────────────────────────────────────────────────────

SECRET_KEY = os.environ.get("JWT_SECRET", "edu-survey-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 giờ

security = HTTPBearer(auto_error=False)

# ── Token helpers ─────────────────────────────────────────────────────────────

def create_access_token(user_id: int, email: str, roles: list[str]) -> str:
    """Tạo JWT access token cho user."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "roles": roles,
        "type": "access",
        "exp": datetime.datetime.now(datetime.timezone.utc)
            + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.datetime.now(datetime.timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    """Tạo JWT refresh token với hạn dài hơn."""
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
        "iat": datetime.datetime.now(datetime.timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Giải mã và xác minh JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token đã hết hạn")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")


# ── FastAPI Dependencies ──────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI Dependency — trích xuất user hiện tại từ Bearer token.
    Raise 401 nếu token thiếu/không hợp lệ hoặc user không tồn tại.
    Raise 403 nếu tài khoản bị khóa.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập")

    payload = decode_token(credentials.credentials)
    try:
        user_id = int(payload.get("sub") or 0)
    except (ValueError, TypeError):
        user_id = 0

    if not user_id:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

    result = supabase_client.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Người dùng không tồn tại")

    user = result.data[0]
    if user.get("status") == "locked":
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    from src.repositories.role import get_user_roles
    user["roles"] = get_user_roles(user_id)
    return user
