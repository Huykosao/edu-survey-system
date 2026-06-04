"""
routers/improvements.py  (v2 — typed request/response models)
"""

from fastapi import APIRouter, Depends, HTTPException
from src.core.security import get_current_user
from src.core.middleware import require_manager
from src.models.notification import (
    CreateImprovementRequest,
    ImprovementResponse,
)
from src.models.auth import MessageResponse
from src.repositories.improvement import (
    create_improvement,
    list_improvements,
    get_improvement_by_id,
)

router = APIRouter(
    prefix="/api",
    tags=["Improvements"],
    responses={404: {"description": "Not found"}},
)


@router.post("/improvements", response_model=ImprovementResponse)
def create_improvement_announcement(
    req: CreateImprovementRequest,
    current_user: dict = Depends(require_manager),
):
    """Tạo thông báo cải tiến. [MANAGER, ADMIN]"""
    return create_improvement({
        "survey_id": req.survey_id,
        "title": req.title,
        "content": req.content,
        "target_roles": req.target_roles,
        "created_by": current_user["id"],
    })


@router.get("/improvements", response_model=list[ImprovementResponse])
def list_all_improvements(_: dict = Depends(get_current_user)):
    """Danh sách thông báo cải tiến. [Mọi user đã đăng nhập]"""
    return list_improvements()


@router.get("/improvements/{iid}", response_model=ImprovementResponse)
def get_improvement(iid: int, _: dict = Depends(get_current_user)):
    """Chi tiết thông báo cải tiến. [Mọi user đã đăng nhập]"""
    item = get_improvement_by_id(iid)
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo cải tiến")
    return item
