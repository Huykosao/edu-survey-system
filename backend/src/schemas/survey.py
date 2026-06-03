"""
schemas/survey.py
──────────────────
Pydantic models ánh xạ bảng `surveys` và `survey_responses`.
"""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from enum import Enum


class SurveyStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


# ── surveys ───────────────────────────────────────────────────────────────────

class SurveyRow(BaseModel):
    """Toàn bộ cột bảng surveys — dùng để đọc."""
    id: int
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    content: dict = Field(default_factory=dict)
    status: SurveyStatus = SurveyStatus.DRAFT
    is_anonymous: bool = True
    target_config: dict = Field(default_factory=dict)
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None


class NewSurveyRow(BaseModel):
    """Dữ liệu để INSERT vào bảng surveys."""
    title: str = Field(..., max_length=255)
    description: str = ""
    content: dict = Field(default_factory=dict)
    status: SurveyStatus = SurveyStatus.DRAFT
    is_anonymous: bool = True
    target_config: dict = Field(default_factory=dict)
    created_by: int


class UpdateSurveyRow(BaseModel):
    """Dữ liệu cập nhật bảng surveys — tất cả optional."""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    content: Optional[dict] = None
    status: Optional[SurveyStatus] = None
    is_anonymous: Optional[bool] = None
    target_config: Optional[dict] = None


# ── survey_responses ──────────────────────────────────────────────────────────

class SurveyResponseRow(BaseModel):
    """Toàn bộ cột bảng survey_responses — dùng để đọc."""
    id: int
    survey_id: int
    user_id: Optional[int] = None
    subject_id: Optional[int] = None
    answers: dict = Field(default_factory=dict)
    raw_content_text: Optional[str] = None
    ai_classification: dict = Field(default_factory=dict)
    submitted_at: Optional[datetime] = None


class NewSurveyResponseRow(BaseModel):
    """Dữ liệu để INSERT vào bảng survey_responses."""
    survey_id: int
    user_id: Optional[int] = None
    subject_id: Optional[int] = None
    answers: dict = Field(default_factory=dict)
    raw_content_text: str = ""


# ── survey_stats & survey_reports ─────────────────────────────────────────────

class SurveyStatsRow(BaseModel):
    """Toàn bộ cột bảng survey_stats."""
    id: Optional[int] = None
    survey_id: int
    segment_type: str = Field(..., max_length=50)
    segment_value: str = Field(..., max_length=100)
    total_responses: int = 0
    question_analysis: dict = Field(default_factory=dict)
    last_updated: Optional[datetime] = None


class SurveyReportRow(BaseModel):
    """Toàn bộ cột bảng survey_reports."""
    id: Optional[int] = None
    survey_id: int
    summary_text: Optional[str] = None
    key_findings: Optional[dict] = None
    recommendations: Optional[str] = None
    generated_at: Optional[datetime] = None
