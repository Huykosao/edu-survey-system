"""
models/notification.py
───────────────────────
Request/Response models cho các endpoint thông báo.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    """Response GET /api/notifications"""
    id: int
    recipient_id: int
    type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None


class ImprovementResponse(BaseModel):
    """Response GET /api/improvements"""
    id: int
    survey_id: Optional[int] = None
    title: Optional[str] = None
    content: Optional[str] = None
    target_roles: list[str] = []
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None


class CreateImprovementRequest(BaseModel):
    """Body POST /api/improvements"""
    survey_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    target_roles: list[str] = Field(default_factory=lambda: ["STUDENT"])


class DashboardOverviewResponse(BaseModel):
    """Response GET /api/dashboard/overview"""
    total_users: int
    total_surveys: int
    total_responses: int
