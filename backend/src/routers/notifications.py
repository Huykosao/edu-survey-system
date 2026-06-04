"""
routers/notifications.py  (v2 — typed response models)
"""

from fastapi import APIRouter, Depends
from src.core.security import get_current_user
from src.models.notification import NotificationResponse
from src.models.auth import MessageResponse
from src.repositories.notification import (
    list_notifications,
    list_unread_notifications,
    mark_notification_read,
    mark_all_read,
)

router = APIRouter(
    prefix="/api",
    tags=["Notifications"],
    responses={404: {"description": "Not found"}},
)


@router.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(current_user: dict = Depends(get_current_user)):
    """Danh sách tất cả thông báo của user. [Mọi user đã đăng nhập]"""
    return list_notifications(current_user["id"])


@router.get("/notifications/unread", response_model=list[NotificationResponse])
def get_unread_notifications(current_user: dict = Depends(get_current_user)):
    """Danh sách thông báo chưa đọc. [Mọi user đã đăng nhập]"""
    return list_unread_notifications(current_user["id"])


@router.patch("/notifications/{nid}/read", response_model=MessageResponse)
def read_notification(nid: int, current_user: dict = Depends(get_current_user)):
    """Đánh dấu một thông báo đã đọc. [Mọi user đã đăng nhập]"""
    mark_notification_read(nid, current_user["id"])
    return {"message": "Đánh dấu đã đọc"}


@router.patch("/notifications/read-all", response_model=MessageResponse)
def read_all_notifications(current_user: dict = Depends(get_current_user)):
    """Đánh dấu tất cả thông báo đã đọc. [Mọi user đã đăng nhập]"""
    mark_all_read(current_user["id"])
    return {"message": "Đánh dấu tất cả đã đọc"}
