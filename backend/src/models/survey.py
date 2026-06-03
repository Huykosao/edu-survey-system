"""
models/survey.py
─────────────────
Request/Response models cho các endpoint khảo sát và phản hồi.
"""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


# ── Survey Requests ───────────────────────────────────────────────────────────

class CreateSurveyRequest(BaseModel):
    """Body POST /api/surveys"""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    content: dict = Field(default_factory=dict)
    status: str = Field("draft", pattern="^(draft|published|closed)$")
    is_anonymous: bool = True
    target_config: dict = Field(default_factory=dict)


class UpdateSurveyRequest(BaseModel):
    """Body PUT /api/surveys/{id}"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    content: Optional[dict] = None
    status: Optional[str] = Field(None, pattern="^(draft|published|closed)$")
    is_anonymous: Optional[bool] = None
    target_config: Optional[dict] = None


class SubmitSurveyResponseRequest(BaseModel):
    """Body POST /api/surveys/{id}/responses"""
    subject_id: Optional[int] = None
    answers: dict = Field(default_factory=dict)
    raw_content_text: str = ""


# ── Survey Responses ──────────────────────────────────────────────────────────

class SurveyResponse(BaseModel):
    """Response GET/POST /api/surveys"""
    id: int
    title: str
    description: Optional[str] = None
    content: dict = {}
    status: str
    is_anonymous: bool
    target_config: dict = {}
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None


class SurveyListResponse(BaseModel):
    """Response GET /api/surveys"""
    data: list[SurveyResponse]
    total: int


class SurveyResponseItem(BaseModel):
    """Response GET /api/surveys/{id}/responses — một phản hồi."""
    id: int
    survey_id: int
    user_id: Optional[int] = None
    subject_id: Optional[int] = None
    answers: dict = {}
    raw_content_text: Optional[str] = None
    submitted_at: Optional[datetime] = None
