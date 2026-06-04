"""
models/master_data.py
──────────────────────
Request/Response models cho các endpoint danh mục.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Faculty ───────────────────────────────────────────────────────────────────

class CreateFacultyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class UpdateFacultyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class FacultyResponse(BaseModel):
    id: int
    name: str


# ── Major ─────────────────────────────────────────────────────────────────────

class CreateMajorRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    faculty_id: int


class UpdateMajorRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    faculty_id: Optional[int] = None


class MajorResponse(BaseModel):
    id: int
    name: str
    faculty_id: int
    faculties: Optional[dict] = None  # joined name


# ── Class ─────────────────────────────────────────────────────────────────────

class CreateClassRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    major_id: int


class UpdateClassRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    major_id: Optional[int] = None


class ClassResponse(BaseModel):
    id: int
    name: str
    major_id: int
    majors: Optional[dict] = None  # joined name


# ── Subject ───────────────────────────────────────────────────────────────────

class CreateSubjectRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    faculty_id: int


class UpdateSubjectRequest(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=255)
    faculty_id: Optional[int] = None


class SubjectResponse(BaseModel):
    id: int
    code: str
    name: str
    faculty_id: int
    faculties: Optional[dict] = None  # joined name
