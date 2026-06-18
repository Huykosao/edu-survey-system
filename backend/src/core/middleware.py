"""
core/middleware.py
──────────────────
FastAPI Dependencies phân quyền theo role.
Sử dụng trong router bằng `Depends(require_admin)`, v.v.
"""

from fastapi import Depends, HTTPException
from src.core.security import get_current_user


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Chỉ cho phép ADMIN."""
    roles = current_user.get("roles", [])
    if "ADMIN" not in roles:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Admin")
    return current_user


def require_admin_or_manager(current_user: dict = Depends(get_current_user)) -> dict:
    """Cho phép MANAGER hoặc ADMIN."""
    roles = current_user.get("roles", [])
    if "MANAGER" not in roles and "ADMIN" not in roles:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Quản lý hoặc Admin")
    return current_user


def require_lecturer(current_user: dict = Depends(get_current_user)) -> dict:
    """Chỉ cho phép LECTURER."""
    roles = current_user.get("roles", [])
    if "LECTURER" not in roles:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Giảng viên")
    return current_user

def require_manager(current_user: dict = Depends(get_current_user)) -> dict:
    """Alows only manager"""
    roles = current_user.get("roles", [])
    if "MANAGER" not in roles:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Quản lý")
    return current_user