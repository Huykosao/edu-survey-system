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
    result = supabase_client.rpc("get_dashboard_counts").execute()
    counts = result.data[0] if isinstance(result.data, list) and result.data else {}
    return {
        "total_users": counts.get("total_users", 0),
        "total_surveys": counts.get("total_surveys", 0),
        "total_responses": counts.get("total_responses", 0),
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
