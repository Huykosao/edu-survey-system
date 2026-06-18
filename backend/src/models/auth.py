"""
models/auth.py
───────────────
Request/Response models cho các endpoint xác thực.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    """Body POST /auth/login"""
    email: EmailStr
    password: str = Field(..., min_length=1)


class ChangePasswordRequest(BaseModel):
    """Body PUT /auth/change-password"""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    """Response trả về sau khi đăng nhập thành công."""
    access_token: str
    token_type: str = "bearer"
    user: dict  # UserPublicResponse — tránh circular import


class MessageResponse(BaseModel):
    """Response đơn giản chỉ có message."""
    message: str
