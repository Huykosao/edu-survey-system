"""
routers/master_data.py  (v2 — typed request/response models)
"""

from fastapi import APIRouter, Depends
from src.core.security import get_current_user
from src.core.middleware import require_admin
from src.models.master_data import (
    CreateFacultyRequest, UpdateFacultyRequest, FacultyResponse,
    CreateMajorRequest, UpdateMajorRequest, MajorResponse,
    CreateClassRequest, UpdateClassRequest, ClassResponse,
    CreateSubjectRequest, UpdateSubjectRequest, SubjectResponse,
)
from src.models.auth import MessageResponse
from src.repositories import master_data as repo

router = APIRouter(
    prefix="/api",
    tags=["Master Data"],
    responses={404: {"description": "Not found"}},
)


# ── Faculties ─────────────────────────────────────────────────────────────────

@router.get("/faculties", response_model=list[FacultyResponse])
def list_faculties(_: dict = Depends(get_current_user)):
    return repo.list_faculties()


@router.post("/faculties", response_model=FacultyResponse)
def create_faculty(req: CreateFacultyRequest, _: dict = Depends(require_admin)):
    return repo.create_faculty(req.name)


@router.put("/faculties/{fid}", response_model=FacultyResponse)
def update_faculty(fid: int, req: UpdateFacultyRequest, _: dict = Depends(require_admin)):
    return repo.update_faculty(fid, req.name)


@router.delete("/faculties/{fid}", response_model=MessageResponse)
def delete_faculty(fid: int, _: dict = Depends(require_admin)):
    repo.delete_faculty(fid)
    return {"message": "Xóa thành công"}


# ── Majors ────────────────────────────────────────────────────────────────────

@router.get("/majors", response_model=list[MajorResponse])
def list_majors(_: dict = Depends(get_current_user)):
    return repo.list_majors()


@router.post("/majors", response_model=MajorResponse)
def create_major(req: CreateMajorRequest, _: dict = Depends(require_admin)):
    return repo.create_major(req.name, req.faculty_id)


@router.put("/majors/{mid}", response_model=MajorResponse)
def update_major(mid: int, req: UpdateMajorRequest, _: dict = Depends(require_admin)):
    return repo.update_major(mid, req.model_dump(exclude_none=True))


@router.delete("/majors/{mid}", response_model=MessageResponse)
def delete_major(mid: int, _: dict = Depends(require_admin)):
    repo.delete_major(mid)
    return {"message": "Xóa thành công"}


# ── Classes ───────────────────────────────────────────────────────────────────

@router.get("/classes", response_model=list[ClassResponse])
def list_classes(_: dict = Depends(get_current_user)):
    return repo.list_classes()


@router.post("/classes", response_model=ClassResponse)
def create_class(req: CreateClassRequest, _: dict = Depends(require_admin)):
    return repo.create_class(req.name, req.major_id)


@router.put("/classes/{cid}", response_model=ClassResponse)
def update_class(cid: int, req: UpdateClassRequest, _: dict = Depends(require_admin)):
    return repo.update_class(cid, req.model_dump(exclude_none=True))


@router.delete("/classes/{cid}", response_model=MessageResponse)
def delete_class(cid: int, _: dict = Depends(require_admin)):
    repo.delete_class(cid)
    return {"message": "Xóa thành công"}


# ── Subjects ──────────────────────────────────────────────────────────────────

@router.get("/subjects", response_model=list[SubjectResponse])
def list_subjects(_: dict = Depends(get_current_user)):
    return repo.list_subjects()


@router.post("/subjects", response_model=SubjectResponse)
def create_subject(req: CreateSubjectRequest, _: dict = Depends(require_admin)):
    return repo.create_subject(req.code, req.name, req.faculty_id)


@router.put("/subjects/{sid}", response_model=SubjectResponse)
def update_subject(sid: int, req: UpdateSubjectRequest, _: dict = Depends(require_admin)):
    return repo.update_subject(sid, req.model_dump(exclude_none=True))


@router.delete("/subjects/{sid}", response_model=MessageResponse)
def delete_subject(sid: int, _: dict = Depends(require_admin)):
    repo.delete_subject(sid)
    return {"message": "Xóa thành công"}
