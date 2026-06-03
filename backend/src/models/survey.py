"""
models/survey.py
─────────────────
Request/Response models cho các endpoint khảo sát và phản hồi.
`content` sử dụng SurveyContent để validate cấu trúc 5 dạng câu hỏi.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime

from src.schemas.survey import SurveyContent


# ── Survey Requests ───────────────────────────────────────────────────────────

class CreateSurveyRequest(BaseModel):
    """Body POST /api/surveys"""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    content: SurveyContent = Field(
        default_factory=SurveyContent,
        description="Cấu trúc khảo sát gồm sections và câu hỏi theo chuẩn 5 dạng"
    )
    status: str = Field("draft", pattern="^(draft|published|closed)$")
    is_anonymous: bool = True
    target_config: dict = Field(default_factory=dict)

    def content_as_dict(self) -> dict:
        """Serialize content sang dict để lưu vào DB (JSONB)."""
        return self.content.model_dump(mode="json")


class UpdateSurveyRequest(BaseModel):
    """Body PUT /api/surveys/{id}"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    content: Optional[SurveyContent] = Field(
        None,
        description="Cập nhật cấu trúc câu hỏi — phải tuân thủ schema 5 dạng"
    )
    status: Optional[str] = Field(None, pattern="^(draft|published|closed)$")
    is_anonymous: Optional[bool] = None
    target_config: Optional[dict] = None

    def content_as_dict(self) -> Optional[dict]:
        """Serialize content sang dict nếu được cung cấp."""
        if self.content is None:
            return None
        return self.content.model_dump(mode="json")


class SubmitSurveyResponseRequest(BaseModel):
    """
    Body POST /api/surveys/{id}/responses

    `answers` là dict ánh xạ question_id → giá trị câu trả lời:
      - likert:          { "q1": 3 }          (int 1–5)
      - single_choice:   { "q2": "Trực tiếp" }
      - multiple_choice: { "q3": ["A", "B"] }
      - matrix:          { "q4": { "Tiêu chí A": "Tốt" } }
      - nps:             { "q5": 8 }           (int 0–10)
      - open_ended:      { "q6": "Ý kiến..." }
    """
    subject_id: Optional[int] = None
    answers: dict = Field(
        default_factory=dict,
        description="Dict ánh xạ question_id → câu trả lời theo format tương ứng loại câu hỏi"
    )
    raw_content_text: str = Field(
        "",
        description="Tổng hợp nội dung text từ câu hỏi open_ended (dùng cho AI embedding)"
    )


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
