"""
schemas/user.py
────────────────
Pydantic models ánh xạ bảng `users` và `profile_details`.
Dùng để insert/update/select với Supabase, KHÔNG expose ra HTTP.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from src.share.types import ValidEmail, UserStatus
from src.share.utils import time


# ── users ─────────────────────────────────────────────────────────────────────

class UserRow(BaseModel):
    """Toàn bộ cột bảng users — dùng để đọc từ DB."""
    id: int
    username: str = Field(..., max_length=100)
    password_hash: str
    email: ValidEmail = Field(..., max_length=255)
    full_name: Optional[str] = Field(None, max_length=255)
    status: UserStatus = UserStatus.ACTIVE
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class NewUserRow(BaseModel):
    """Dữ liệu tối thiểu để INSERT vào bảng users."""
    username: str = Field(..., max_length=100)
    password_hash: str
    email: ValidEmail = Field(..., max_length=255)
    full_name: str = Field(..., max_length=255)
    last_login: datetime = Field(default_factory=time.get_current_timestamptz)
    created_at: datetime = Field(default_factory=time.get_current_timestamptz)
    updated_at: datetime = Field(default_factory=time.get_current_timestamptz)


class UpdateUserRow(BaseModel):
    """Dữ liệu cập nhật bảng users — tất cả optional."""
    full_name: Optional[str] = Field(None, max_length=255)
    status: Optional[UserStatus] = None
    updated_at: datetime = Field(default_factory=time.get_current_timestamptz)


# ── profile_details ───────────────────────────────────────────────────────────

class ProfileDetailRow(BaseModel):
    """Toàn bộ cột bảng profile_details — dùng để đọc."""
    user_id: int
    faculty_id: Optional[int] = None
    major_id: Optional[int] = None
    class_id: Optional[int] = None
    student_code: Optional[str] = Field(None, max_length=50)
    lecturer_code: Optional[str] = Field(None, max_length=50)
    is_alumni: bool = False
    graduation_year: Optional[int] = None
    company_name: Optional[str] = Field(None, max_length=255)
    position: Optional[str] = Field(None, max_length=100)
    metadata: dict = Field(default_factory=dict)


class UpsertProfileDetailRow(BaseModel):
    """Dữ liệu để INSERT/UPDATE profile_details — không có user_id (tự set)."""
    faculty_id: Optional[int] = None
    major_id: Optional[int] = None
    class_id: Optional[int] = None
    student_code: Optional[str] = Field(None, max_length=50)
    lecturer_code: Optional[str] = Field(None, max_length=50)
    is_alumni: Optional[bool] = None
    graduation_year: Optional[int] = None
    company_name: Optional[str] = Field(None, max_length=255)
    position: Optional[str] = Field(None, max_length=100)
    metadata: Optional[dict] = None
