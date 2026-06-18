"""
routers/allowed_domains.py
──────────────────────────
Router quản lý danh sách các tên miền email được phép. [ADMIN]
"""

from fastapi import APIRouter, Depends
from src.core.middleware import require_admin
from src.models.allowed_domain import AllowedDomainRequest, AllowedDomainResponse
from src.models.auth import MessageResponse
from src.repositories.allowed_domain import (
    list_allowed_domains,
    create_allowed_domain,
    update_allowed_domain,
    delete_allowed_domain,
)

router = APIRouter(
    prefix="/api/allowed-domains",
    tags=["Allowed Domains"],
    responses={404: {"description": "Not found"}},
)


@router.get("", response_model=list[AllowedDomainResponse])
def get_allowed_domains(_: dict = Depends(require_admin)):
    """Lấy danh sách các tên miền được phép. [ADMIN]"""
    return list_allowed_domains()


@router.post("", response_model=AllowedDomainResponse)
def add_allowed_domain(req: AllowedDomainRequest, _: dict = Depends(require_admin)):
    """Thêm tên miền mới. [ADMIN]"""
    return create_allowed_domain(req.domain, req.description)


@router.put("/{domain_id}", response_model=AllowedDomainResponse)
def modify_allowed_domain(
    domain_id: int, req: AllowedDomainRequest, _: dict = Depends(require_admin)
):
    """Cập nhật tên miền hoặc ghi chú. [ADMIN]"""
    return update_allowed_domain(domain_id, req.model_dump(exclude_none=True))


@router.delete("/{domain_id}", response_model=MessageResponse)
def remove_allowed_domain(domain_id: int, _: dict = Depends(require_admin)):
    """Xóa tên miền khỏi danh sách. [ADMIN]"""
    delete_allowed_domain(domain_id)
    return {"message": "Xóa tên miền thành công"}
