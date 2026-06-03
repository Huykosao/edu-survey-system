"""
routers/dashboard.py  (v2 — typed response models)
"""

from fastapi import APIRouter, Depends
from src.core.security import get_current_user
from src.core.middleware import require_admin
from src.models.notification import DashboardOverviewResponse
from src.schemas.improvement import SystemLogRow
from src.core.database import supabase_client

router = APIRouter(
    prefix="/api",
    tags=["Dashboard"],
    responses={404: {"description": "Not found"}},
)


@router.get("/dashboard/overview", response_model=DashboardOverviewResponse)
def dashboard_overview(_: dict = Depends(get_current_user)):
    """Thống kê tổng quan hệ thống. [Mọi user đã đăng nhập]"""
    users = supabase_client.table("users").select("id", count="exact").limit(1).execute()
    surveys = supabase_client.table("surveys").select("id", count="exact").limit(1).execute()
    responses = supabase_client.table("survey_responses").select("id", count="exact").limit(1).execute()
    return {
        "total_users": users.count or 0,
        "total_surveys": surveys.count or 0,
        "total_responses": responses.count or 0,
    }


@router.get("/system-logs", response_model=list[SystemLogRow])
def list_system_logs(_: dict = Depends(require_admin)):
    """Nhật ký hoạt động hệ thống. [ADMIN]"""
    result = (
        supabase_client.table("system_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return result.data or []
