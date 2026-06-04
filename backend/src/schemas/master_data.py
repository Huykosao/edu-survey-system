"""
schemas/master_data.py
───────────────────────
Pydantic models ánh xạ các bảng danh mục:
faculties, majors, classes, subjects.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── faculties ─────────────────────────────────────────────────────────────────

class FacultyRow(BaseModel):
    id: int
    name: str = Field(..., max_length=255)


class NewFacultyRow(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


# ── majors ────────────────────────────────────────────────────────────────────

class MajorRow(BaseModel):
    id: int
    name: str = Field(..., max_length=255)
    faculty_id: int


class NewMajorRow(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    faculty_id: int


class UpdateMajorRow(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    faculty_id: Optional[int] = None


# ── classes ───────────────────────────────────────────────────────────────────

class ClassRow(BaseModel):
    id: int
    name: str = Field(..., max_length=50)
    major_id: int


class NewClassRow(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    major_id: int


class UpdateClassRow(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    major_id: Optional[int] = None


# ── subjects ──────────────────────────────────────────────────────────────────

class SubjectRow(BaseModel):
    id: int
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    faculty_id: int


class NewSubjectRow(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    faculty_id: int


class UpdateSubjectRow(BaseModel):
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=255)
    faculty_id: Optional[int] = None
