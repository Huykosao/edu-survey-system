"""
models/clarification.py
────────────────────────
Request/Response models cho quy trình giải trình.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Requests ──────────────────────────────────────────────────────────────────

class CreateClarificationRequest(BaseModel):
    """Body POST /api/clarifications — Manager tạo yêu cầu giải trình."""
    survey_id: int
    lecturer_id: int
    request_reason: str = Field(..., min_length=1)
    deadline: Optional[datetime] = None


class SubmitClarificationRequest(BaseModel):
    """Body POST /api/clarifications/{id}/submit — Lecturer nộp giải trình."""
    explanation_content: str = Field(..., min_length=1)
    commitment_text: str = ""


class RejectClarificationRequest(BaseModel):
    """Body POST /api/clarifications/{id}/reject — Manager từ chối."""
    admin_comment: str = ""


class SubmitLecturerResponseRequest(BaseModel):
    """Body POST /api/clarifications/{id}/responses — Lecturer gửi phản hồi sinh viên."""
    message_content: str = Field(..., min_length=1)


# ── Responses ─────────────────────────────────────────────────────────────────

class ClarificationResponse(BaseModel):
    """Response GET /api/clarifications"""
    id: int
    survey_id: int
    lecturer_id: int
    requested_by: int
    request_reason: str
    deadline: Optional[datetime] = None
    explanation_content: Optional[str] = None
    commitment_text: Optional[str] = None
    is_disputed: bool = False
    status: str
    admin_comment: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class LecturerResponseItem(BaseModel):
    """Response GET /api/responses-to-students/pending"""
    id: int
    clarification_id: int
    message_content: str
    is_published: bool
    approved_by: Optional[int] = None
    created_at: Optional[datetime] = None
    survey_clarifications: Optional[dict] = None

