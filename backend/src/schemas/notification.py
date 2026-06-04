"""
schemas/notification.py
────────────────────────
Pydantic models ánh xạ bảng notifications.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NotificationRow(BaseModel):
    """Toàn bộ cột bảng notifications — dùng để đọc."""
    id: int
    recipient_id: int
    type: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None


class NewNotificationRow(BaseModel):
    """Dữ liệu để INSERT vào bảng notifications."""
    recipient_id: int
    type: str = Field(..., max_length=50)
    title: str = Field(..., max_length=255)
    content: str = ""
    is_read: bool = False
