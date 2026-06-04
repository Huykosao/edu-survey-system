"""
schemas/improvement.py
───────────────────────
Pydantic models ánh xạ bảng improvement_announcements.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ImprovementRow(BaseModel):
    """Toàn bộ cột bảng improvement_announcements — dùng để đọc."""
    id: int
    survey_id: Optional[int] = None
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    target_roles: list[str] = Field(default_factory=list)
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None


class NewImprovementRow(BaseModel):
    """Dữ liệu để INSERT vào bảng improvement_announcements."""
    survey_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    content: str
    target_roles: list[str] = Field(default_factory=lambda: ["STUDENT"])
    created_by: int


class SystemLogRow(BaseModel):
    """Toàn bộ cột bảng system_logs — dùng để đọc."""
    id: int
    user_id: Optional[int] = None
    action: Optional[str] = Field(None, max_length=255)
    details: Optional[dict] = None
    ip_address: Optional[str] = Field(None, max_length=45)
    created_at: Optional[datetime] = None


class RoleRow(BaseModel):
    """Toàn bộ cột bảng roles."""
    id: int
    name: str = Field(..., max_length=50)
    description: Optional[str] = None
    created_at: Optional[datetime] = None
