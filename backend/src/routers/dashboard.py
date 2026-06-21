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
    try:
        res_users = supabase_client.table("users").select("id", count="exact").limit(1).execute()
        total_users = res_users.count if res_users.count is not None else 0

        res_surveys = supabase_client.table("surveys").select("id", count="exact").limit(1).execute()
        total_surveys = res_surveys.count if res_surveys.count is not None else 0

        res_responses = supabase_client.table("survey_responses").select("id", count="exact").limit(1).execute()
        total_responses = res_responses.count if res_responses.count is not None else 0

        res_clarifications = supabase_client.table("survey_clarifications").select("id", count="exact").eq("status", "pending").limit(1).execute()
        pending_clarifications = res_clarifications.count if res_clarifications.count is not None else 0
        
        avg_rating = 0.0
    except Exception as e:
        print(f"Error counting dashboard: {e}")
        total_users = 0
        total_surveys = 0
        total_responses = 0
        pending_clarifications = 0
        avg_rating = 0.0

    return {
        "total_users": total_users,
        "total_surveys": total_surveys,
        "total_responses": total_responses,
        "pending_clarifications": pending_clarifications,
        "avg_rating": avg_rating,
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
