from src.services import label as label_service
from src.models.label import LabelListResponse, LabelResponse, CreateLabelRequest, UpdateLabelRequest
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

@router.put("/label/{label_id}", response_model=LabelResponse)
def update_label(label_id: int, req: UpdateLabelRequest, _: dict = Depends(require_manager)):
    """Cập nhật nhãn."""
    return label_service.update_label_service(label_id, req.model_dump())

@router.delete("/label/{label_id}")
def delete_label(label_id: int, _: dict = Depends(require_manager)):
    """Xóa nhãn."""
    label_service.delete_label_service(label_id)
    return {"message": "Xóa nhãn thành công"}