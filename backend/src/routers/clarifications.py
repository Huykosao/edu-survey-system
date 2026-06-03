"""
routers/clarifications.py  (v2 — typed request/response models)
"""

from fastapi import APIRouter, Depends
from src.core.security import get_current_user
from src.core.middleware import require_manager, require_lecturer
from src.models.clarification import (
    CreateClarificationRequest,
    SubmitClarificationRequest,
    RejectClarificationRequest,
    SubmitLecturerResponseRequest,
    ClarificationResponse,
    LecturerResponseItem,
)
from src.models.auth import MessageResponse
from src.services import clarification as clar_svc
from src.repositories.clarification import (
    list_all_clarifications,
    list_clarifications_for_lecturer,
    create_lecturer_response,
    list_pending_lecturer_responses,
    list_published_lecturer_responses,
    approve_lecturer_response,
)

router = APIRouter(
    prefix="/api",
    tags=["Clarifications"],
    responses={404: {"description": "Not found"}},
)


# ── Manager endpoints ─────────────────────────────────────────────────────────

@router.get("/clarifications", response_model=list[ClarificationResponse])
def list_clarifications(_: dict = Depends(require_manager)):
    """Danh sách tất cả yêu cầu giải trình. [MANAGER, ADMIN]"""
    return list_all_clarifications()


@router.post("/clarifications", response_model=ClarificationResponse)
def create_clarification(
    req: CreateClarificationRequest,
    current_user: dict = Depends(require_manager),
):
    """Manager tạo yêu cầu giải trình gửi Lecturer. [MANAGER, ADMIN]"""
    return clar_svc.request_clarification(req.model_dump(), current_user["id"])


@router.post("/clarifications/{cid}/approve", response_model=ClarificationResponse)
def approve_clarification(cid: int, _: dict = Depends(require_manager)):
    """Manager duyệt giải trình. [MANAGER, ADMIN]"""
    return clar_svc.approve_clarification(cid)


@router.post("/clarifications/{cid}/reject", response_model=ClarificationResponse)
def reject_clarification(
    cid: int,
    req: RejectClarificationRequest,
    _: dict = Depends(require_manager),
):
    """Manager từ chối giải trình. [MANAGER, ADMIN]"""
    return clar_svc.reject_clarification(cid, req.admin_comment)


@router.get("/responses-to-students/pending", response_model=list[LecturerResponseItem])
def list_pending_responses(_: dict = Depends(require_manager)):
    """Danh sách phản hồi Lecturer chờ duyệt. [MANAGER, ADMIN]"""
    return list_pending_lecturer_responses()


@router.post("/responses-to-students/{rid}/approve", response_model=LecturerResponseItem)
def approve_response(rid: int, current_user: dict = Depends(require_manager)):
    """Manager duyệt phản hồi của Lecturer cho sinh viên. [MANAGER, ADMIN]"""
    return approve_lecturer_response(rid, current_user["id"])


# ── Lecturer endpoints ────────────────────────────────────────────────────────

@router.get("/clarifications/my-tasks", response_model=list[ClarificationResponse])
def list_my_tasks(current_user: dict = Depends(require_lecturer)):
    """Lecturer xem các yêu cầu giải trình được giao. [LECTURER]"""
    return list_clarifications_for_lecturer(current_user["id"])


@router.post("/clarifications/{cid}/submit", response_model=ClarificationResponse)
def submit_clarification(
    cid: int,
    req: SubmitClarificationRequest,
    current_user: dict = Depends(require_lecturer),
):
    """Lecturer nộp nội dung giải trình. [LECTURER]"""
    return clar_svc.submit_clarification(cid, req.model_dump(), current_user["id"])


@router.post("/clarifications/{cid}/dispute", response_model=ClarificationResponse)
def dispute_clarification(cid: int, current_user: dict = Depends(require_lecturer)):
    """Lecturer tranh chấp kết quả giải trình. [LECTURER]"""
    return clar_svc.dispute_clarification(cid, current_user["id"])


@router.post("/clarifications/{cid}/responses", response_model=LecturerResponseItem)
def submit_response_to_students(
    cid: int,
    req: SubmitLecturerResponseRequest,
    _: dict = Depends(require_lecturer),
):
    """Lecturer gửi thông điệp phản hồi sinh viên (chờ duyệt). [LECTURER]"""
    return create_lecturer_response({
        "clarification_id": cid,
        "message_content": req.message_content,
        "is_published": False,
    })


# ── Student / Public endpoints ────────────────────────────────────────────────

@router.get("/student-feedbacks", response_model=list[LecturerResponseItem])
def get_student_feedbacks(_: dict = Depends(get_current_user)):
    """Sinh viên xem phản hồi đã được duyệt từ Lecturer. [Mọi user đã đăng nhập]"""
    return list_published_lecturer_responses()
