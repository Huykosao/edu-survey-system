"""
routers/surveys.py  (v2 — typed request/response models)
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional, Literal

from src.core.security import get_current_user
from src.core.middleware import (
    require_admin_or_manager,
    require_manager
)
from src.models.survey import (
    CreateSurveyRequest,
    SurveyStatus,
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
    _: dict = Depends(require_admin_or_manager),
):
    """Danh sách tất cả khảo sát. [MANAGER, ADMIN]"""
    return survey_svc.get_all_surveys(status)


@router.get("/surveys/{sid}", response_model=SurveyResponse)
def get_survey(sid: int, _: dict = Depends(get_current_user)):
    """Chi tiết một khảo sát. [Mọi user đã đăng nhập]"""
    return survey_svc.get_survey(sid)


@router.post("/surveys", response_model=SurveyResponse)
def create_survey(
    req: CreateSurveyRequest,
    current_user: dict = Depends(require_admin_or_manager)
):
    data = req.model_dump(mode="json", exclude={"content"})
    data["content"] = req.content_as_dict()

    return survey_svc.create_new_survey(
        data,
        current_user["id"]
    )


@router.put("/surveys/{sid}", response_model=SurveyResponse)
def update_survey(sid: int, req: UpdateSurveyRequest, _: dict = Depends(require_admin_or_manager)):
    """Cập nhật khảo sát. [MANAGER, ADMIN]"""
    data = req.model_dump(
        mode="json",
        exclude_none=True,
        exclude={"content"}
    )
    content_dict = req.content_as_dict()
    if content_dict is not None:
        data["content"] = content_dict
    return survey_svc.modify_survey(sid, data)


@router.delete("/surveys/{sid}", response_model=MessageResponse)
def delete_survey_endpoint(sid: int, _: dict = Depends(require_admin_or_manager)):
    """Xóa khảo sát. [MANAGER, ADMIN]"""
    delete_survey(sid)
    return {"message": "Xóa khảo sát thành công"}


@router.post("/surveys/{sid}/publish", response_model=SurveyResponse)
def publish_survey(sid: int, _: dict = Depends(require_admin_or_manager)):
    """Phát hành khảo sát. [MANAGER, ADMIN]"""
    return update_survey_status(sid, SurveyStatus.PUBLISHED.value)


@router.post("/surveys/{sid}/close", response_model=SurveyResponse)
def close_survey(sid: int, _: dict = Depends(require_admin_or_manager)):
    """Đóng khảo sát. [MANAGER, ADMIN]"""
    return update_survey_status(sid, SurveyStatus.CLOSED.value)


@router.post("/surveys/{sid}/duplicate", response_model=SurveyResponse)
def duplicate_survey(sid: int, current_user: dict = Depends(require_admin_or_manager)):
    """Nhân bản khảo sát. [MANAGER, ADMIN]"""
    return survey_svc.duplicate_survey(sid, current_user["id"])


# ── Survey Responses (All users) ──────────────────────────────────────────────

@router.get("/my-surveys", response_model=list[SurveyResponse])
def get_my_surveys(current_user: dict = Depends(get_current_user)):
    """Danh sách khảo sát đang phát hành mà user CHƯA làm."""
    return survey_svc.get_surveys_for_user(current_user)


@router.get("/my-completed-surveys", response_model=list[SurveyResponse])
def get_my_completed_surveys(current_user: dict = Depends(get_current_user)):
    """Danh sách khảo sát mà user ĐÃ hoàn thành."""
    return survey_svc.get_completed_surveys_for_user(current_user)


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
def list_responses(sid: int, _: dict = Depends(require_admin_or_manager)):
    """Danh sách tất cả phản hồi của một khảo sát. [MANAGER, ADMIN]"""
    return list_responses_by_survey(sid)


@router.get("/responses/{rid}", response_model=SurveyResponseItem)
def get_response(rid: int, _: dict = Depends(require_admin_or_manager)):
    """Chi tiết một phản hồi. [MANAGER, ADMIN]"""
    return survey_svc.get_single_response(rid)


@router.get("/surveys/{sid}/analysis")
def get_surveys_analysis(
    sid: int,
    segment_type: Literal["OVERALL", "FACULTY", "SUBJECT"] = Query("OVERALL", description="OVERALL, FACULTY, or SUBJECT"),
    segment_value: str = Query("ALL", description="ID của Khoa hoặc Môn học"),
    _: dict = Depends(require_admin_or_manager)
):
    """
    Lấy báo cáo phân tích kết quả khảo sát. 
    Manager có thể lọc theo Khoa (segment_type=FACULTY, segment_value=1) 
    hoặc Môn học để phục vụ việc giải trình.
    """
    return survey_svc.get_survey_analysis(sid, segment_type, segment_value)


@router.get("/surveys/{sid}/general-stats")
def get_survey_general_stats(
    sid: int,
    _: dict = Depends(require_admin_or_manager)
):
    """
    Lấy thống kê chung của khảo sát sử dụng hàm PG (số lượng tham gia, số phản hồi mở, v.v.).
    [MANAGER, ADMIN]
    """
    from src.repositories.ai_report import get_dashboard_overview
    try:
        overview = get_dashboard_overview(sid)
        return overview
    except Exception as e:
        # Fallback if function fails or not ready
        from src.core.database import supabase_client
        res = supabase_client.table("survey_responses").select("id").eq("survey_id", sid).execute()
        return {
            "total_responses": len(res.data) if res.data else 0,
            "total_open_feedbacks": 0,
            "total_labels": 0,
            "positive_count": 0,
            "negative_count": 0,
            "neutral_count": 0
        }
