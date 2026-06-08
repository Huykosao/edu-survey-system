"""
models/user.py
───────────────
Request/Response models cho các endpoint quản lý user và profile.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from src.share.types import ValidEmail


# ── Requests ──────────────────────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    """Body POST /api/users — Admin tạo user mới."""
    email: ValidEmail = Field(..., max_length=255)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=255)
    role_ids: Optional[list[int]] = None
    phone: Optional[str] = None
    faculty_id: Optional[int] = None
    faculty_name: Optional[str] = None


class BulkCreateUserRequest(BaseModel):
    """Body POST /api/users/bulk — Admin tạo nhiều user cùng lúc."""
    users: list[CreateUserRequest] = Field(..., max_length=500)


class UpdateUserRequest(BaseModel):
    """Body PUT /api/users/{id} — Admin cập nhật user."""
    full_name: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = None          # active | inactive | locked
    role_ids: Optional[list[int]] = None


class UpdateUserStatusRequest(BaseModel):
    """Body PATCH /api/users/{id}/status — Admin khóa/mở tài khoản."""
    status: str = Field(..., pattern="^(active|inactive|locked)$")


class UpdateUserRolesRequest(BaseModel):
    """Body PUT /api/users/{id}/roles — Admin thay đổi quyền."""
    role_ids: list[int]


class UpdateProfileRequest(BaseModel):
    """Body PUT /api/profile — User tự cập nhật tên."""
    full_name: Optional[str] = Field(None, max_length=255)


class UpdateProfileDetailRequest(BaseModel):
    """Body PUT /api/profile/details — User tự cập nhật chi tiết."""
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


# ── Responses ─────────────────────────────────────────────────────────────────

class UserPublicResponse(BaseModel):
    """Response an toàn — không có password_hash."""
    id: int
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    status: Optional[str] = None
    roles: list[str] = []
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None


class UserListResponse(BaseModel):
    """Response GET /api/users — danh sách users có phân trang."""
    data: list[UserPublicResponse]
    total: int


class ProfileDetailResponse(BaseModel):
    """Response GET /api/profile/details."""
    user_id: Optional[int] = None
    faculty_id: Optional[int] = None
    major_id: Optional[int] = None
    class_id: Optional[int] = None
    student_code: Optional[str] = None
    lecturer_code: Optional[str] = None
    is_alumni: bool = False
    graduation_year: Optional[int] = None
    company_name: Optional[str] = None
    position: Optional[str] = None
    metadata: dict = {}
