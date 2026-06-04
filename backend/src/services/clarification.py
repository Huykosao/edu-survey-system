"""
services/clarification.py
──────────────────────────
Business logic cho quy trình giải trình.
"""

from src.repositories import clarification as clar_repo
from src.repositories.notification import create_notification


def request_clarification(data: dict, requested_by: int) -> dict:
    """Manager tạo yêu cầu giải trình và gửi thông báo cho Lecturer."""
    clar_data = {
        "survey_id": data["survey_id"],
        "lecturer_id": data["lecturer_id"],
        "requested_by": requested_by,
        "request_reason": data["request_reason"],
        "deadline": data.get("deadline"),
        "status": "pending",
    }
    created = clar_repo.create_clarification(clar_data)

    create_notification({
        "recipient_id": data["lecturer_id"],
        "type": "CLARIFICATION",
        "title": "Yêu cầu giải trình kết quả khảo sát",
        "content": f"Cán bộ quản lý yêu cầu bạn giải trình. Lý do: {data['request_reason']}",
    })
    return created


def submit_clarification(cid: int, data: dict, lecturer_id: int) -> dict:
    """Lecturer nộp nội dung giải trình."""
    update = {
        "explanation_content": data["explanation_content"],
        "commitment_text": data.get("commitment_text", ""),
        "status": "submitted",
    }
    return clar_repo.update_clarification(cid, update, lecturer_id=lecturer_id)


def approve_clarification(cid: int) -> dict:
    return clar_repo.set_clarification_status(cid, "approved")


def reject_clarification(cid: int, admin_comment: str) -> dict:
    return clar_repo.set_clarification_status(
        cid, "rejected", extra={"admin_comment": admin_comment}
    )


def dispute_clarification(cid: int, lecturer_id: int) -> dict:
    return clar_repo.update_clarification(
        cid, {"status": "disputed", "is_disputed": True}, lecturer_id=lecturer_id
    )
