from src.services import label as label_service
from src.models.label import LabelListResponse, LabelResponse, CreateLabelRequest
from fastapi import APIRouter, Depends
from src.core.security import get_current_user
from src.core.middleware import require_manager

router = APIRouter(
    prefix="/api",
    tags=["Survey Label"],
    responses={404: {"description": "Not found"}},
)

@router.get("/label/{role_id}", response_model=LabelListResponse)
def list_labels(role_id: int,  _: dict = Depends(require_manager)):
    """Lấy danh sách nhãn theo ID của Role (Ví dụ: STUDENT là 4)"""
    return label_service.list_labels_service(role_id)

@router.post("/label", response_model=LabelResponse)
def add_label(req: CreateLabelRequest, _: dict = Depends(require_manager)):
    """
    Tạo nhãn mới. 
    Request body cần có role_id (ví dụ: { "role_id": 4, "label_name": "Cơ sở vật chất" })
    """
    return label_service.create_label_service(req.model_dump())