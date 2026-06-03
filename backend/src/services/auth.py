"""
services/auth.py
─────────────────
Business logic cho xác thực: hash password, tạo token, tạo user mới.
"""

import bcrypt
from src.models.user import CreateUserRequest
from src.schemas.user import NewUserRow
from src.repositories.user import create_user


def hash_password(plain_password: str) -> bytes:
    """Hash mật khẩu bằng bcrypt."""
    if not isinstance(plain_password, str) or not plain_password:
        raise ValueError("Password must be a non-empty string.")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt)


def verify_password(plain_password: str, hashed_password: bytes) -> bool:
    """Xác minh mật khẩu với hash đã lưu."""
    if not isinstance(plain_password, str) or not plain_password:
        return False
    if not isinstance(hashed_password, bytes):
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password)
    except ValueError:
        return False


def create_user_service(req: CreateUserRequest) -> dict:
    """Tạo user mới từ request — hash password rồi lưu DB."""
    new_user = NewUserRow(
        full_name=req.full_name,
        email=req.email,
        password_hash=hash_password(req.password).decode("utf-8"),
        username=req.email[:100],  # Sử dụng toàn bộ email (giới hạn 100 ký tự) làm username để tránh trùng lặp
    )
    return create_user(new_user)