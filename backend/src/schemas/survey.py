"""
schemas/survey.py
──────────────────
Pydantic models ánh xạ bảng `surveys` và `survey_responses`.
Bao gồm schema chuẩn cho 5 dạng câu hỏi:
  1. likert         — Thang đo Likert (1–5)
  2. single_choice  — Trắc nghiệm một đáp án
  3. multiple_choice — Trắc nghiệm nhiều đáp án
  4. matrix         — Ma trận đánh giá
  5. nps            — Net Promoter Score (0–10)
  6. open_ended     — Câu hỏi mở
"""

from pydantic import BaseModel, Field, model_validator
from typing import Optional, Literal, Union, Annotated
from datetime import datetime
from enum import Enum


# ── Enums ─────────────────────────────────────────────────────────────────────

class SurveyStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class QuestionType(str, Enum):
    LIKERT = "likert"
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    MATRIX = "matrix"
    NPS = "nps"
    OPEN_ENDED = "open_ended"


# ── Question Schemas (5 dạng) ─────────────────────────────────────────────────

class LikertQuestion(BaseModel):
    """
    Thang đo Likert (1–5). Đo mức độ đồng ý/hài lòng.
    Answer format: { "q_id": 3 }  (int 1–5)
    """
    id: str = Field(..., description="ID câu hỏi, duy nhất trong survey, VD: 'q1'")
    type: Literal["likert"] = "likert"
    label: str = Field(..., min_length=1, description="Nội dung câu hỏi")
    required: bool = True
    min_label: str = Field(default="Hoàn toàn không đồng ý", description="Nhãn mức thấp nhất")
    max_label: str = Field(default="Hoàn toàn đồng ý", description="Nhãn mức cao nhất")


class SingleChoiceQuestion(BaseModel):
    """
    Trắc nghiệm một đáp án. Thu thập phân loại / xu hướng.
    Answer format: { "q_id": "Trực tiếp" }  (string, 1 trong options)
    """
    id: str
    type: Literal["single_choice"] = "single_choice"
    label: str = Field(..., min_length=1)
    required: bool = True
    options: list[str] = Field(..., min_length=2, description="Danh sách lựa chọn (ít nhất 2)")


class MultipleChoiceQuestion(BaseModel):
    """
    Trắc nghiệm nhiều đáp án. Thu thập nhiều thông tin cùng lúc.
    Answer format: { "q_id": ["Trực tiếp", "Trực tuyến"] }  (list[str])
    """
    id: str
    type: Literal["multiple_choice"] = "multiple_choice"
    label: str = Field(..., min_length=1)
    required: bool = True
    options: list[str] = Field(..., min_length=2)
    max_selections: Optional[int] = Field(None, description="Số lựa chọn tối đa, None = không giới hạn")


class MatrixQuestion(BaseModel):
    """
    Ma trận đánh giá. Gộp nhiều tiêu chí vào một bảng.
    Answer format: { "q_id": { "Nội dung bài giảng": "Tốt", ... } }
    """
    id: str
    type: Literal["matrix"] = "matrix"
    label: str = Field(..., min_length=1)
    required: bool = True
    rows: list[str] = Field(..., min_length=1, description="Các tiêu chí cần đánh giá")
    columns: list[str] = Field(
        default=["Kém", "Trung bình", "Khá", "Tốt", "Rất tốt"],
        description="Các mức đánh giá"
    )


class NpsQuestion(BaseModel):
    """
    Net Promoter Score (0–10). Đo mức độ sẵn sàng giới thiệu.
    Answer format: { "q_id": 8 }  (int 0–10)
    """
    id: str
    type: Literal["nps"] = "nps"
    label: str = Field(..., min_length=1)
    required: bool = True
    min_label: str = Field(default="Hoàn toàn không", description="Nhãn mức 0")
    max_label: str = Field(default="Chắc chắn có", description="Nhãn mức 10")


class OpenEndedQuestion(BaseModel):
    """
    Câu hỏi mở. Thu thập ý kiến tự do.
    Answer format: { "q_id": "Tôi muốn..." }  (string)
    """
    id: str
    type: Literal["open_ended"] = "open_ended"
    label: str = Field(..., min_length=1)
    required: bool = False
    placeholder: str = Field(
        default="Nhập ý kiến của bạn tại đây...",
        description="Placeholder hiển thị trong textarea"
    )
    max_length: int = Field(default=2000, description="Độ dài tối đa của câu trả lời")


# Union type đại diện cho bất kỳ loại câu hỏi nào
AnyQuestion = Annotated[
    Union[
        LikertQuestion,
        SingleChoiceQuestion,
        MultipleChoiceQuestion,
        MatrixQuestion,
        NpsQuestion,
        OpenEndedQuestion,
    ],
    Field(discriminator="type"),
]


# ── Survey Content Structure ───────────────────────────────────────────────────

class SurveySection(BaseModel):
    """Một phần/nhóm câu hỏi trong khảo sát."""
    id: Optional[str] = Field(None, description="ID section, VD: 's1'. Tự động tạo nếu thiếu.")
    title: str = Field(..., min_length=1, description="Tiêu đề phần")
    description: Optional[str] = Field(None, description="Mô tả tùy chọn")
    questions: list[AnyQuestion] = Field(
        default_factory=list,
        description="Danh sách câu hỏi trong phần này"
    )

    @model_validator(mode="after")
    def validate_unique_question_ids(self) -> "SurveySection":
        ids = [q.id for q in self.questions]
        if len(ids) != len(set(ids)):
            raise ValueError("Các câu hỏi trong một section phải có ID duy nhất")
        return self


class SurveyContent(BaseModel):
    """
    Cấu trúc đầy đủ của trường `content` trong bảng surveys.
    Gồm một hoặc nhiều sections, mỗi section có danh sách câu hỏi.
    """
    sections: list[SurveySection] = Field(
        default_factory=list,
        description="Danh sách các phần của khảo sát"
    )

    @model_validator(mode="after")
    def validate_unique_section_and_question_ids(self) -> "SurveyContent":
        # Auto-generate IDs for sections that don't have one (legacy data support)
        for i, section in enumerate(self.sections):
            if not section.id:
                section.id = f"s{i + 1}"

        section_ids = [s.id for s in self.sections]
        if len(section_ids) != len(set(section_ids)):
            raise ValueError("Các section phải có ID duy nhất")

        all_question_ids: list[str] = []
        for section in self.sections:
            all_question_ids.extend(q.id for q in section.questions)
        if len(all_question_ids) != len(set(all_question_ids)):
            raise ValueError("Tất cả câu hỏi trong survey phải có ID duy nhất trên toàn bộ các sections")
        return self

    def all_questions(self) -> list[AnyQuestion]:
        """Trả về danh sách phẳng tất cả câu hỏi."""
        return [q for section in self.sections for q in section.questions]


# ── surveys table ─────────────────────────────────────────────────────────────

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


# ── survey_responses table ────────────────────────────────────────────────────

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
