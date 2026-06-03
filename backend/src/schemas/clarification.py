"""
schemas/clarification.py
─────────────────────────
Pydantic models ánh xạ bảng survey_clarifications
và lecturer_responses_to_students.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ClarificationStatus(str, Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISPUTED = "disputed"


# ── survey_clarifications ─────────────────────────────────────────────────────

class ClarificationRow(BaseModel):
    """Toàn bộ cột bảng survey_clarifications — dùng để đọc."""
    id: int
    survey_id: int
    lecturer_id: int
    requested_by: int
    request_reason: str
    deadline: Optional[datetime] = None
    explanation_content: Optional[str] = None
    commitment_text: Optional[str] = None
    is_disputed: bool = False
    status: ClarificationStatus = ClarificationStatus.PENDING
    admin_comment: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class NewClarificationRow(BaseModel):
    """Dữ liệu để INSERT vào bảng survey_clarifications."""
    survey_id: int
    lecturer_id: int
    requested_by: int
    request_reason: str
    deadline: Optional[datetime] = None
    status: ClarificationStatus = ClarificationStatus.PENDING


class UpdateClarificationRow(BaseModel):
    """Dữ liệu cập nhật bảng survey_clarifications — tất cả optional."""
    explanation_content: Optional[str] = None
    commitment_text: Optional[str] = None
    is_disputed: Optional[bool] = None
    status: Optional[ClarificationStatus] = None
    admin_comment: Optional[str] = None
    updated_at: Optional[datetime] = None


# ── lecturer_responses_to_students ────────────────────────────────────────────

class LecturerResponseRow(BaseModel):
    """Toàn bộ cột bảng lecturer_responses_to_students — dùng để đọc."""
    id: int
    clarification_id: int
    message_content: str
    is_published: bool = False
    approved_by: Optional[int] = None
    created_at: Optional[datetime] = None


class NewLecturerResponseRow(BaseModel):
    """Dữ liệu để INSERT vào bảng lecturer_responses_to_students."""
    clarification_id: int
    message_content: str
    is_published: bool = False
