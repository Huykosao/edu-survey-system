from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional

from src.models.admin import CreateUserRequest, BulkCreateUser
from src.services.auth import create_user_services, hash_password
from src.routers.auth import get_current_user, get_user_roles, sanitize_user
from src.core.database import supabase_client
import datetime

router = APIRouter(
    prefix="/api",
    tags=["Admin"],
    responses={404: {"description": "Not found"}}
)


def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency that ensures the user has ADMIN role."""
    roles = get_user_roles(current_user["id"])
    if "ADMIN" not in roles:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Admin")
    return current_user


def require_manager(current_user: dict = Depends(get_current_user)):
    """Dependency that ensures the user has MANAGER or ADMIN role."""
    roles = get_user_roles(current_user["id"])
    if "MANAGER" not in roles and "ADMIN" not in roles:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Quản lý hoặc Admin")
    return current_user


def require_lecturer(current_user: dict = Depends(get_current_user)):
    """Dependency that ensures the user has LECTURER role."""
    roles = get_user_roles(current_user["id"])
    if "LECTURER" not in roles:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Giảng viên")
    return current_user



# ─────────────────────────────────────────────
# User Management
# ─────────────────────────────────────────────

@router.get("/users")
def list_users(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_manager),
):
    """List all users with optional filtering."""
    query = supabase_client.table("users").select("*", count="exact")
    
    if status:
        query = query.eq("status", status)
    
    offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1).order("created_at", desc=True)
    
    result = query.execute()
    
    users_with_roles = []
    for u in (result.data or []):
        roles = get_user_roles(u["id"])
        if role and role not in roles:
            continue
        users_with_roles.append(sanitize_user(u, roles))
    
    return {
        "data": users_with_roles,
        "total": result.count or len(users_with_roles),
    }


@router.get("/users/{user_id}")
def get_user(user_id: int, current_user: dict = Depends(require_manager)):
    """Get a single user by ID."""
    result = supabase_client.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    user = result.data[0]
    roles = get_user_roles(user["id"])
    return sanitize_user(user, roles)


@router.post("/users")
def create_user(req: CreateUserRequest, current_user: dict = Depends(require_admin)):
    """Create a new user."""
    new_user = create_user_services(req)
    
    if req.role_ids:
        for role_id in req.role_ids:
            supabase_client.table("user_roles").insert({
                "user_id": new_user["id"],
                "role_id": role_id,
            }).execute()
            
    return new_user


@router.put("/users/{user_id}")
def update_user(user_id: int, data: dict, current_user: dict = Depends(require_admin)):
    """Update user information."""
    update_data = {}
    if "full_name" in data:
        update_data["full_name"] = data["full_name"]
    if "status" in data:
        update_data["status"] = data["status"]
    
    if update_data:
        update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        result = supabase_client.table("users").update(update_data).eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
    if "role_ids" in data:
        role_ids = data["role_ids"]
        supabase_client.table("user_roles").delete().eq("user_id", user_id).execute()
        for role_id in role_ids:
            supabase_client.table("user_roles").insert({
                "user_id": user_id,
                "role_id": role_id,
            }).execute()
    
    return {"message": "Cập nhật thành công"}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(require_admin)):
    """Delete a user."""
    result = supabase_client.table("users").delete().eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return {"message": "Xóa người dùng thành công"}


@router.patch("/users/{user_id}/status")
def update_user_status(user_id: int, data: dict, current_user: dict = Depends(require_admin)):
    """Lock/unlock a user account."""
    status = data.get("status")
    if status not in ("active", "inactive", "locked"):
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")
    
    result = supabase_client.table("users").update({
        "status": status,
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }).eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    return result.data[0]


# ─────────────────────────────────────────────
# User Roles Management
# ─────────────────────────────────────────────

@router.get("/users/{user_id}/roles")
def get_user_roles_endpoint(user_id: int, current_user: dict = Depends(require_admin)):
    """Get roles for a specific user."""
    roles = get_user_roles(user_id)
    return {"roles": roles}


@router.put("/users/{user_id}/roles")
def update_user_roles_endpoint(user_id: int, data: dict, current_user: dict = Depends(require_admin)):
    """Set roles for a user."""
    role_ids = data.get("role_ids", [])
    
    # Delete existing roles
    supabase_client.table("user_roles").delete().eq("user_id", user_id).execute()
    
    # Insert new roles
    for role_id in role_ids:
        supabase_client.table("user_roles").insert({
            "user_id": user_id,
            "role_id": role_id,
        }).execute()
    
    return {"message": "Cập nhật quyền thành công"}


# ─────────────────────────────────────────────
# Master Data: Faculties
# ─────────────────────────────────────────────

@router.get("/faculties")
def list_faculties(current_user: dict = Depends(get_current_user)):
    result = supabase_client.table("faculties").select("*").order("name").execute()
    return result.data or []


@router.post("/faculties")
def create_faculty(data: dict, current_user: dict = Depends(require_admin)):
    result = supabase_client.table("faculties").insert({"name": data["name"]}).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo khoa thất bại")
    return result.data[0]


@router.put("/faculties/{fid}")
def update_faculty(fid: int, data: dict, current_user: dict = Depends(require_admin)):
    result = supabase_client.table("faculties").update({"name": data["name"]}).eq("id", fid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    return result.data[0]


@router.delete("/faculties/{fid}")
def delete_faculty(fid: int, current_user: dict = Depends(require_admin)):
    result = supabase_client.table("faculties").delete().eq("id", fid).execute()
    return {"message": "Xóa thành công"}


# ─────────────────────────────────────────────
# Master Data: Majors
# ─────────────────────────────────────────────

@router.get("/majors")
def list_majors(current_user: dict = Depends(get_current_user)):
    result = supabase_client.table("majors").select("*, faculties(name)").order("name").execute()
    return result.data or []


@router.post("/majors")
def create_major(data: dict, current_user: dict = Depends(require_admin)):
    result = supabase_client.table("majors").insert({
        "name": data["name"], "faculty_id": data["faculty_id"]
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo ngành thất bại")
    return result.data[0]


@router.put("/majors/{mid}")
def update_major(mid: int, data: dict, current_user: dict = Depends(require_admin)):
    update = {}
    if "name" in data:
        update["name"] = data["name"]
    if "faculty_id" in data:
        update["faculty_id"] = data["faculty_id"]
    result = supabase_client.table("majors").update(update).eq("id", mid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    return result.data[0]


@router.delete("/majors/{mid}")
def delete_major(mid: int, current_user: dict = Depends(require_admin)):
    supabase_client.table("majors").delete().eq("id", mid).execute()
    return {"message": "Xóa thành công"}


# ─────────────────────────────────────────────
# Master Data: Classes
# ─────────────────────────────────────────────

@router.get("/classes")
def list_classes(current_user: dict = Depends(get_current_user)):
    result = supabase_client.table("classes").select("*, majors(name)").order("name").execute()
    return result.data or []


@router.post("/classes")
def create_class(data: dict, current_user: dict = Depends(require_admin)):
    result = supabase_client.table("classes").insert({
        "name": data["name"], "major_id": data["major_id"]
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo lớp thất bại")
    return result.data[0]


@router.put("/classes/{cid}")
def update_class(cid: int, data: dict, current_user: dict = Depends(require_admin)):
    update = {}
    if "name" in data:
        update["name"] = data["name"]
    if "major_id" in data:
        update["major_id"] = data["major_id"]
    result = supabase_client.table("classes").update(update).eq("id", cid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    return result.data[0]


@router.delete("/classes/{cid}")
def delete_class(cid: int, current_user: dict = Depends(require_admin)):
    supabase_client.table("classes").delete().eq("id", cid).execute()
    return {"message": "Xóa thành công"}


# ─────────────────────────────────────────────
# Master Data: Subjects
# ─────────────────────────────────────────────

@router.get("/subjects")
def list_subjects(current_user: dict = Depends(get_current_user)):
    result = supabase_client.table("subjects").select("*, faculties(name)").order("name").execute()
    return result.data or []


@router.post("/subjects")
def create_subject(data: dict, current_user: dict = Depends(require_admin)):
    result = supabase_client.table("subjects").insert({
        "code": data["code"], "name": data["name"], "faculty_id": data["faculty_id"]
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo môn học thất bại")
    return result.data[0]


@router.put("/subjects/{sid}")
def update_subject(sid: int, data: dict, current_user: dict = Depends(require_admin)):
    update = {}
    for field in ("code", "name", "faculty_id"):
        if field in data:
            update[field] = data[field]
    result = supabase_client.table("subjects").update(update).eq("id", sid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    return result.data[0]


@router.delete("/subjects/{sid}")
def delete_subject(sid: int, current_user: dict = Depends(require_admin)):
    supabase_client.table("subjects").delete().eq("id", sid).execute()
    return {"message": "Xóa thành công"}


# ─────────────────────────────────────────────
# Profile
# ─────────────────────────────────────────────

@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    roles = get_user_roles(current_user["id"])
    return sanitize_user(current_user, roles)


@router.put("/profile")
def update_profile(data: dict, current_user: dict = Depends(get_current_user)):
    allowed = {"full_name"}
    update_data = {k: v for k, v in data.items() if k in allowed}
    if update_data:
        supabase_client.table("users").update(update_data).eq("id", current_user["id"]).execute()
    return {"message": "Cập nhật thành công"}


@router.get("/profile/details")
def get_profile_details(current_user: dict = Depends(get_current_user)):
    result = supabase_client.table("profile_details").select("*").eq("user_id", current_user["id"]).execute()
    if result.data:
        return result.data[0]
    return {}


@router.put("/profile/details")
def update_profile_details(data: dict, current_user: dict = Depends(get_current_user)):
    existing = supabase_client.table("profile_details").select("user_id").eq("user_id", current_user["id"]).execute()
    
    update_data = {k: v for k, v in data.items() if k != "user_id"}
    
    if existing.data:
        supabase_client.table("profile_details").update(update_data).eq("user_id", current_user["id"]).execute()
    else:
        update_data["user_id"] = current_user["id"]
        supabase_client.table("profile_details").insert(update_data).execute()
    
    return {"message": "Cập nhật thành công"}


# ─────────────────────────────────────────────
# Dashboard Overview
# ─────────────────────────────────────────────

@router.get("/dashboard/overview")
def dashboard_overview(current_user: dict = Depends(get_current_user)):
    # Get counts
    users_result = supabase_client.table("users").select("id", count="exact").execute()
    surveys_result = supabase_client.table("surveys").select("id", count="exact").execute()
    responses_result = supabase_client.table("survey_responses").select("id", count="exact").execute()
    
    return {
        "total_users": users_result.count or 0,
        "total_surveys": surveys_result.count or 0,
        "total_responses": responses_result.count or 0,
    }


# ─────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────

@router.get("/notifications")
def list_notifications(current_user: dict = Depends(get_current_user)):
    result = supabase_client.table("notifications").select("*").eq(
        "recipient_id", current_user["id"]
    ).order("created_at", desc=True).limit(50).execute()
    return result.data or []


@router.get("/notifications/unread")
def list_unread_notifications(current_user: dict = Depends(get_current_user)):
    result = supabase_client.table("notifications").select("*").eq(
        "recipient_id", current_user["id"]
    ).eq("is_read", False).order("created_at", desc=True).execute()
    return result.data or []


@router.patch("/notifications/{nid}/read")
def mark_notification_read(nid: int, current_user: dict = Depends(get_current_user)):
    supabase_client.table("notifications").update({"is_read": True}).eq("id", nid).eq(
        "recipient_id", current_user["id"]
    ).execute()
    return {"message": "Đánh dấu đã đọc"}


@router.patch("/notifications/read-all")
def mark_all_read(current_user: dict = Depends(get_current_user)):
    supabase_client.table("notifications").update({"is_read": True}).eq(
        "recipient_id", current_user["id"]
    ).eq("is_read", False).execute()
    return {"message": "Đánh dấu tất cả đã đọc"}


# ─────────────────────────────────────────────
# Role Dependencies
# ─────────────────────────────────────────────


# ─────────────────────────────────────────────
# Survey Management APIs (MANAGER)
# ─────────────────────────────────────────────

@router.get("/surveys")
def list_surveys(status: Optional[str] = Query(None), current_user: dict = Depends(require_manager)):
    """List all surveys."""
    query = supabase_client.table("surveys").select("*")
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return {"data": result.data or [], "total": len(result.data or [])}


@router.get("/surveys/{sid}")
def get_survey(sid: int, current_user: dict = Depends(get_current_user)):
    """Get survey details."""
    result = supabase_client.table("surveys").select("*").eq("id", sid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return result.data[0]


@router.post("/surveys")
def create_survey(data: dict, current_user: dict = Depends(require_manager)):
    """Create a new survey."""
    survey_data = {
        "title": data.get("title", "Khảo sát không tên"),
        "description": data.get("description", ""),
        "content": data.get("content", {}),
        "status": data.get("status", "draft"),
        "is_anonymous": data.get("is_anonymous", True),
        "target_config": data.get("target_config", {}),
        "created_by": current_user["id"]
    }
    result = supabase_client.table("surveys").insert(survey_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo khảo sát thất bại")
    return result.data[0]


@router.put("/surveys/{sid}")
def update_survey(sid: int, data: dict, current_user: dict = Depends(require_manager)):
    """Update survey details."""
    result = supabase_client.table("surveys").select("*").eq("id", sid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    
    update_data = {}
    for key in ("title", "description", "content", "status", "is_anonymous", "target_config"):
        if key in data:
            update_data[key] = data[key]
            
    res = supabase_client.table("surveys").update(update_data).eq("id", sid).execute()
    return res.data[0]


@router.delete("/surveys/{sid}")
def delete_survey(sid: int, current_user: dict = Depends(require_manager)):
    """Delete a survey."""
    supabase_client.table("surveys").delete().eq("id", sid).execute()
    return {"message": "Xóa khảo sát thành công"}


@router.post("/surveys/{sid}/publish")
def publish_survey(sid: int, current_user: dict = Depends(require_manager)):
    """Publish a survey."""
    res = supabase_client.table("surveys").update({"status": "published"}).eq("id", sid).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return res.data[0]


@router.post("/surveys/{sid}/close")
def close_survey(sid: int, current_user: dict = Depends(require_manager)):
    """Close a survey."""
    res = supabase_client.table("surveys").update({"status": "closed"}).eq("id", sid).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return res.data[0]


@router.post("/surveys/{sid}/duplicate")
def duplicate_survey(sid: int, current_user: dict = Depends(require_manager)):
    """Duplicate a survey."""
    result = supabase_client.table("surveys").select("*").eq("id", sid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    
    orig = result.data[0]
    dup_data = {
        "title": f"Bản sao của {orig['title']}",
        "description": orig["description"],
        "content": orig["content"],
        "status": "draft",
        "is_anonymous": orig["is_anonymous"],
        "target_config": orig["target_config"],
        "created_by": current_user["id"]
    }
    res = supabase_client.table("surveys").insert(dup_data).execute()
    return res.data[0]


@router.get("/my-surveys")
def get_my_surveys(current_user: dict = Depends(get_current_user)):
    """Get list of active surveys assigned to current user."""
    # Simplified: return all published surveys
    result = supabase_client.table("surveys").select("*").eq("status", "published").execute()
    return result.data or []


# ─────────────────────────────────────────────
# Survey Response APIs (STUDENT/ALUMNI/EMPLOYER)
# ─────────────────────────────────────────────

@router.post("/surveys/{sid}/responses")
def submit_response(sid: int, data: dict, current_user: dict = Depends(get_current_user)):
    """Submit responses to a survey."""
    survey = supabase_client.table("surveys").select("is_anonymous").eq("id", sid).execute()
    if not survey.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    
    is_anon = survey.data[0].get("is_anonymous", True)
    
    resp_data = {
        "survey_id": sid,
        "user_id": None if is_anon else current_user["id"],
        "subject_id": data.get("subject_id"),
        "answers": data.get("answers", {}),
        "raw_content_text": data.get("raw_content_text", "")
    }
    result = supabase_client.table("survey_responses").insert(resp_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Gửi phản hồi thất bại")
    return result.data[0]


@router.get("/surveys/{sid}/my-response")
def check_my_response(sid: int, current_user: dict = Depends(get_current_user)):
    """Check if current user already submitted a response."""
    result = supabase_client.table("survey_responses").select("*").eq("survey_id", sid).eq("user_id", current_user["id"]).execute()
    if result.data:
        return result.data[0]
    return None


@router.get("/surveys/{sid}/responses")
def list_survey_responses(sid: int, current_user: dict = Depends(require_manager)):
    """List all responses for a survey."""
    result = supabase_client.table("survey_responses").select("*, users(full_name)").eq("survey_id", sid).execute()
    return result.data or []


@router.get("/responses/{rid}")
def get_response_details(rid: int, current_user: dict = Depends(require_manager)):
    """Get single response details."""
    result = supabase_client.table("survey_responses").select("*").eq("id", rid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy phản hồi")
    return result.data[0]


# ─────────────────────────────────────────────
# Clarification Workflow APIs (MANAGER <-> LECTURER)
# ─────────────────────────────────────────────

@router.post("/clarifications")
def request_clarification(data: dict, current_user: dict = Depends(require_manager)):
    """Manager requests clarification from a lecturer."""
    clar_data = {
        "survey_id": data["survey_id"],
        "lecturer_id": data["lecturer_id"],
        "requested_by": current_user["id"],
        "request_reason": data["request_reason"],
        "deadline": data.get("deadline"),
        "status": "pending"
    }
    result = supabase_client.table("survey_clarifications").insert(clar_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo yêu cầu giải trình thất bại")
    
    # Notify Lecturer
    supabase_client.table("notifications").insert({
        "recipient_id": data["lecturer_id"],
        "type": "CLARIFICATION",
        "title": "Yêu cầu giải trình kết quả khảo sát",
        "content": f"Cán bộ quản lý yêu cầu bạn giải trình. Lý do: {data['request_reason']}"
    }).execute()
    
    return result.data[0]


@router.get("/clarifications/my-tasks")
def list_my_clarification_tasks(current_user: dict = Depends(require_lecturer)):
    """Lecturer lists their assigned clarification tasks."""
    result = supabase_client.table("survey_clarifications").select("*, surveys(title)").eq("lecturer_id", current_user["id"]).execute()
    return result.data or []


@router.post("/clarifications/{cid}/submit")
def submit_clarification(cid: int, data: dict, current_user: dict = Depends(require_lecturer)):
    """Lecturer submits explanation content."""
    res = supabase_client.table("survey_clarifications").update({
        "explanation_content": data["explanation_content"],
        "commitment_text": data.get("commitment_text", ""),
        "status": "submitted",
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }).eq("id", cid).eq("lecturer_id", current_user["id"]).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu giải trình")
    return res.data[0]


@router.post("/clarifications/{cid}/approve")
def approve_clarification(cid: int, current_user: dict = Depends(require_manager)):
    """Manager approves clarification."""
    res = supabase_client.table("survey_clarifications").update({"status": "approved"}).eq("id", cid).execute()
    return res.data[0]


@router.post("/clarifications/{cid}/reject")
def reject_clarification(cid: int, data: dict, current_user: dict = Depends(require_manager)):
    """Manager rejects clarification."""
    res = supabase_client.table("survey_clarifications").update({
        "status": "rejected",
        "admin_comment": data.get("admin_comment", "")
    }).eq("id", cid).execute()
    return res.data[0]


@router.post("/clarifications/{cid}/dispute")
def dispute_clarification(cid: int, current_user: dict = Depends(require_lecturer)):
    """Lecturer disputes a clarification outcome."""
    res = supabase_client.table("survey_clarifications").update({
        "status": "disputed",
        "is_disputed": True
    }).eq("id", cid).eq("lecturer_id", current_user["id"]).execute()
    return res.data[0]


# ─────────────────────────────────────────────
# Lecturer Responses to Students
# ─────────────────────────────────────────────

@router.post("/clarifications/{cid}/responses")
def submit_response_to_students(cid: int, data: dict, current_user: dict = Depends(require_lecturer)):
    """Lecturer submits a message to be approved and sent to students."""
    resp_data = {
        "clarification_id": cid,
        "message_content": data["message_content"],
        "is_published": False
    }
    result = supabase_client.table("lecturer_responses_to_students").insert(resp_data).execute()
    return result.data[0]


@router.post("/responses-to-students/{rid}/approve")
def approve_response_to_students(rid: int, current_user: dict = Depends(require_manager)):
    """Manager approves lecturer message to students."""
    res = supabase_client.table("lecturer_responses_to_students").update({
        "is_published": True,
        "approved_by": current_user["id"]
    }).eq("id", rid).execute()
    return res.data[0]


@router.get("/student-feedbacks")
def get_student_feedbacks(current_user: dict = Depends(get_current_user)):
    """Students view published lecturer responses."""
    result = supabase_client.table("lecturer_responses_to_students").select(
        "*, survey_clarifications(surveys(title), users(full_name))"
    ).eq("is_published", True).execute()
    return result.data or []


# ─────────────────────────────────────────────
# Improvement Announcement Module
# ─────────────────────────────────────────────

@router.post("/improvements")
def create_improvement(data: dict, current_user: dict = Depends(require_manager)):
    """Create an improvement announcement."""
    imp_data = {
        "survey_id": data.get("survey_id"),
        "title": data["title"],
        "content": data["content"],
        "target_roles": data.get("target_roles", ["STUDENT"]),
        "created_by": current_user["id"]
    }
    result = supabase_client.table("improvement_announcements").insert(imp_data).execute()
    return result.data[0]


@router.get("/improvements")
def list_improvements(current_user: dict = Depends(get_current_user)):
    """List improvement announcements."""
    result = supabase_client.table("improvement_announcements").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.get("/improvements/{iid}")
def get_improvement(iid: int, current_user: dict = Depends(get_current_user)):
    """Get single improvement announcement details."""
    result = supabase_client.table("improvement_announcements").select("*").eq("id", iid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo cải tiến")
    return result.data[0]


# ─────────────────────────────────────────────
# Extra Endpoints for Real Data Integration
# ─────────────────────────────────────────────

@router.get("/system-logs")
def list_system_logs(current_user: dict = Depends(require_admin)):
    """List system activity logs (ADMIN)."""
    result = supabase_client.table("system_logs").select("*").order("created_at", desc=True).limit(100).execute()
    return result.data or []


@router.get("/clarifications")
def list_all_clarifications(current_user: dict = Depends(require_manager)):
    """List all clarification requests (MANAGER)."""
    result = supabase_client.table("survey_clarifications").select(
        "*, surveys(title), users!lecturer_id(full_name)"
    ).order("created_at", desc=True).execute()
    return result.data or []


@router.get("/responses-to-students/pending")
def list_pending_responses(current_user: dict = Depends(require_manager)):
    """List pending lecturer responses to students (MANAGER)."""
    result = supabase_client.table("lecturer_responses_to_students").select(
        "*, survey_clarifications(request_reason, surveys(title), users!lecturer_id(full_name))"
    ).eq("is_published", False).execute()
    return result.data or []