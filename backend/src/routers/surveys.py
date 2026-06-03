"""
routers/surveys.py  (v2 — typed request/response models)
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional

from src.core.security import get_current_user
from src.core.middleware import require_manager
from src.models.survey import (
    CreateSurveyRequest,
    UpdateSurveyRequest,
    SubmitSurveyResponseRequest,
    SurveyResponse,
    SurveyListResponse,
    SurveyResponseItem,
)
from src.models.auth import MessageResponse
from src.services import survey as survey_svc
from src.repositories.survey import (
    list_responses_by_survey,
    get_my_response,
    list_published_surveys,
    delete_survey,
    update_survey_status,
)

router = APIRouter(
    prefix="/api",
    tags=["Surveys"],
    responses={404: {"description": "Not found"}},
)


# ── Survey Management (MANAGER) ───────────────────────────────────────────────

@router.get("/surveys", response_model=SurveyListResponse)
def list_surveys(
    status: Optional[str] = Query(None),
    _: dict = Depends(require_manager),
):
    """Danh sách tất cả khảo sát. [MANAGER, ADMIN]"""
    return survey_svc.get_all_surveys(status)


@router.get("/surveys/{sid}", response_model=SurveyResponse)
def get_survey(sid: int, _: dict = Depends(get_current_user)):
    """Chi tiết một khảo sát. [Mọi user đã đăng nhập]"""
    return survey_svc.get_survey(sid)


@router.post("/surveys", response_model=SurveyResponse)
def create_survey(req: CreateSurveyRequest, current_user: dict = Depends(require_manager)):
    """Tạo khảo sát mới. [MANAGER, ADMIN]"""
    return survey_svc.create_new_survey(req.model_dump(), current_user["id"])


@router.put("/surveys/{sid}", response_model=SurveyResponse)
def update_survey(sid: int, req: UpdateSurveyRequest, _: dict = Depends(require_manager)):
    """Cập nhật khảo sát. [MANAGER, ADMIN]"""
    return survey_svc.modify_survey(sid, req.model_dump(exclude_none=True))


@router.delete("/surveys/{sid}", response_model=MessageResponse)
def delete_survey_endpoint(sid: int, _: dict = Depends(require_manager)):
    """Xóa khảo sát. [MANAGER, ADMIN]"""
    delete_survey(sid)
    return {"message": "Xóa khảo sát thành công"}


@router.post("/surveys/{sid}/publish", response_model=SurveyResponse)
def publish_survey(sid: int, _: dict = Depends(require_manager)):
    """Phát hành khảo sát. [MANAGER, ADMIN]"""
    return update_survey_status(sid, "published")


@router.post("/surveys/{sid}/close", response_model=SurveyResponse)
def close_survey(sid: int, _: dict = Depends(require_manager)):
    """Đóng khảo sát. [MANAGER, ADMIN]"""
    return update_survey_status(sid, "closed")


@router.post("/surveys/{sid}/duplicate", response_model=SurveyResponse)
def duplicate_survey(sid: int, current_user: dict = Depends(require_manager)):
    """Nhân bản khảo sát. [MANAGER, ADMIN]"""
    return survey_svc.duplicate_survey(sid, current_user["id"])


# ── Survey Responses (All users) ──────────────────────────────────────────────

@router.get("/my-surveys", response_model=list[SurveyResponse])
def get_my_surveys(_: dict = Depends(get_current_user)):
    """Danh sách khảo sát đang phát hành."""
    return list_published_surveys()


@router.post("/surveys/{sid}/responses", response_model=SurveyResponseItem)
def submit_response(
    sid: int,
    req: SubmitSurveyResponseRequest,
    current_user: dict = Depends(get_current_user),
):
    """Nộp phản hồi khảo sát. [Mọi user đã đăng nhập]"""
    return survey_svc.submit_survey_response(sid, req.model_dump(), current_user["id"])


@router.get("/surveys/{sid}/my-response", response_model=Optional[SurveyResponseItem])
def check_my_response(sid: int, current_user: dict = Depends(get_current_user)):
    """Kiểm tra user đã trả lời khảo sát này chưa."""
    return get_my_response(sid, current_user["id"])


@router.get("/surveys/{sid}/responses", response_model=list[SurveyResponseItem])
def list_responses(sid: int, _: dict = Depends(require_manager)):
    """Danh sách tất cả phản hồi của một khảo sát. [MANAGER, ADMIN]"""
    return list_responses_by_survey(sid)


@router.get("/responses/{rid}", response_model=SurveyResponseItem)
def get_response(rid: int, _: dict = Depends(require_manager)):
    """Chi tiết một phản hồi. [MANAGER, ADMIN]"""
    return survey_svc.get_single_response(rid)
