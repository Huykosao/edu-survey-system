"""
repositories/survey.py
──────────────────────
Toàn bộ truy vấn DB liên quan đến bảng surveys và survey_responses.
"""

from fastapi import HTTPException
from src.core.database import supabase_client


# ── Surveys ───────────────────────────────────────────────────────────────────

def list_surveys(status: str | None = None) -> list[dict]:
    query = supabase_client.table("surveys").select("*")
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


def get_survey_by_id(survey_id: int) -> dict | None:
    result = supabase_client.table("surveys").select("*").eq("id", survey_id).execute()
    return result.data[0] if result.data else None


def create_survey(survey_data: dict) -> dict:
    result = supabase_client.table("surveys").insert(survey_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo khảo sát thất bại")
    return result.data[0]


def update_survey(survey_id: int, update_data: dict) -> dict:
    result = supabase_client.table("surveys").update(update_data).eq("id", survey_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return result.data[0]


def delete_survey(survey_id: int) -> None:
    supabase_client.table("surveys").delete().eq("id", survey_id).execute()


def update_survey_status(survey_id: int, status: str) -> dict:
    result = supabase_client.table("surveys").update({"status": status}).eq("id", survey_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài khảo sát")
    return result.data[0]


def list_published_surveys() -> list[dict]:
    result = supabase_client.table("surveys").select("*").eq("status", "published").execute()
    return result.data or []

def list_surveys_by_ids(survey_ids: list[int]) -> list[dict]:
    if not survey_ids:
        return []
    result = supabase_client.table("surveys").select("*").in_("id", survey_ids).execute()
    return result.data or []


def list_responded_survey_ids(user_id: int) -> set[int]:
    """Lấy tập hợp survey_id mà user đã nộp phản hồi."""
    result = (
        supabase_client.table("survey_participations")
        .select("survey_id")
        .eq("user_id", user_id)
        .execute()
    )
    return {row["survey_id"] for row in (result.data or [])}

def submit_response_atomic(survey_id: int, user_id: int, subject_id: int | None, answers: dict, raw_content_text: str, is_anonymous: bool) -> dict:
    """Sử dụng RPC để submit response và record participation trong một transaction."""
    try:
        result = supabase_client.rpc('submit_survey_response_tx', {
            'p_survey_id': survey_id,
            'p_user_id': user_id,
            'p_subject_id': subject_id,
            'p_answers': answers,
            'p_raw_content_text': raw_content_text,
            'p_is_anonymous': is_anonymous
        }).execute()
        data = result.data
        if isinstance(data, list) and len(data) > 0:
            return data[0]
        return data or {}
    except Exception as e:
        # Nếu Postgres throw unique constraint violation, RPC sẽ fail
        if getattr(e, "code", None) == "23505" or "unique constraint" in str(e).lower() or "survey_participations" in str(e).lower():
            raise HTTPException(status_code=400, detail="Bạn đã gửi phản hồi cho khảo sát này rồi.")
        raise HTTPException(status_code=500, detail=f"Gửi phản hồi thất bại: {str(e)}")


# ── Survey Responses ──────────────────────────────────────────────────────────

def create_response(resp_data: dict) -> dict:
    result = supabase_client.table("survey_responses").insert(resp_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Gửi phản hồi thất bại")
    return result.data[0]


def get_my_response(survey_id: int, user_id: int) -> dict | None:
    result = (
        supabase_client.table("survey_responses")
        .select("*")
        .eq("survey_id", survey_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None


def list_responses_by_survey(survey_id: int) -> list[dict]:
    result = (
        supabase_client.table("survey_responses")
        .select("*, users(full_name)")
        .eq("survey_id", survey_id)
        .execute()
    )
    return result.data or []


def get_response_by_id(response_id: int) -> dict | None:
    result = (
        supabase_client.table("survey_responses")
        .select("*")
        .eq("id", response_id)
        .execute()
    )
    return result.data[0] if result.data else None

def get_survey_stat(
    survey_id: int,
    segment_type: str = "OVERALL",
    segment_value: str = "ALL"
) -> dict | None:

    result = (
        supabase_client
        .table("survey_stats")
        .select("*")
        .eq("survey_id", survey_id)
        .eq("segment_type", segment_type)
        .eq("segment_value", segment_value)
        .limit(1)
        .execute()
    )

    return result.data[0] if result.data else None

def create_survey_stat(data: dict) -> dict:

    result = (
        supabase_client
        .table("survey_stats")
        .upsert(data)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=500,
            detail="Không tạo hoặc cập nhật được survey_stats"
        )

    return result.data[0]

def update_survey_stat(
    stat_id: int,
    update_data: dict
) -> dict:

    result = (
        supabase_client
        .table("survey_stats")
        .update(update_data)
        .eq("id", stat_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy survey_stats"
        )

    return result.data[0]

def list_responses_with_filters(survey_id: int, segment_type: str = "OVERALL", segment_value: str = "ALL") -> list[dict]:
    # Base query
    query = supabase_client.table("survey_responses").select("*").eq("survey_id", survey_id)
    
    # Lọc theo Môn học
    # Lọc theo Môn học
    if segment_type == "SUBJECT" and segment_value != "ALL":
        try:
            query = query.eq("subject_id", int(segment_value))
        except ValueError:
            raise HTTPException(status_code=400, detail="ID môn học không hợp lệ")
    
    # Lọc theo Khoa (thông qua bảng profile_details của user)
    elif segment_type == "FACULTY" and segment_value != "ALL":
        try:
            query = query.eq("users.profile_details.faculty_id", int(segment_value))
        except ValueError:
            raise HTTPException(status_code=400, detail="ID khoa không hợp lệ")
    
    result = query.execute()
    return result.data or []

def delete_survey_stats(survey_id: int, segment_type: str = None, segment_value: str = None) -> None:
    """Xóa thống kê để ép buộc tính toán lại (Cache Invalidation)."""
    query = supabase_client.table("survey_stats").delete().eq("survey_id", survey_id)
    if segment_type:
        query = query.eq("segment_type", segment_type)
    if segment_value:
        query = query.eq("segment_value", segment_value)
    query.execute()

def get_labels_by_role(role_name: str) -> list[dict]:
    table_map = {
        "STUDENT": "student_response_class",
        "LECTURER": "teacher_response_class",
        "EMPLOYER": "employer_response_class"
    }
    table_name = table_map.get(role_name.upper(), "student_response_class")
    result = supabase_client.table(table_name).select("*").execute()
    return result.data or []

def get_responses_for_ai(survey_id: int) -> list[dict]:
    result = (
        supabase_client.table("survey_responses")
        .select("id, raw_content_text")
        .eq("survey_id", survey_id)
        .not_.is_("raw_content_text", "null")
        .execute()
    )
    return result.data or []

def bulk_insert_response_labels(rows: list[dict]):
    if not rows: return
    return supabase_client.table("response_labels").insert(rows).execute()

def get_survey_stats_data(survey_id: int) -> dict:
    result = (
        supabase_client.table("survey_stats")
        .select("question_analysis")
        .eq("survey_id", survey_id)
        .eq("segment_type", "OVERALL")
        .maybe_single()
        .execute()
    )
    return result.data or {}

def get_labeled_feedbacks_for_report(survey_id: int) -> list[dict]:
    # RPC này cần join response_labels + survey_responses + bảng class tương ứng
    result = supabase_client.rpc('get_labeled_feedbacks', {'p_survey_id': survey_id}).execute()
    return result.data or []

def insert_ai_report(survey_id: int, report_data: dict):
    payload = {
        "survey_id": survey_id,
        "summary_text": report_data.get("executive_summary"),
        "key_findings": report_data.get("detailed_trends"), # JSONB
        "recommendations": report_data.get("overall_recommendation")
    }
    return supabase_client.table("survey_reports").insert(payload).execute()

def get_open_responses_grouped_by_question(survey_id: int):
    """
    Lấy danh sách các câu trả lời mở, gom theo Question ID.
    Cấu trúc trả về: { "q1": [{"res_id": 1, "text": "..."}, ...], "q2": [...] }
    """
    survey_data = supabase_client.table("surveys").select("content").eq("id", survey_id).single().execute().data
    sections = survey_data.get("content", {}).get("sections", [])
    
    open_question_ids = []
    question_map = {}
    for sec in sections:
        for q in sec.get("questions", []):
            if q.get("type") == "open_ended":
                open_question_ids.append(q.get("id"))
                question_map[q.get("id")] = q.get("label")

    responses = supabase_client.table("survey_responses").select("id, answers").eq("survey_id", survey_id).execute().data
    
    grouped_data = {}
    for q_id in open_question_ids:
        grouped_data[q_id] = {
            "question_text": question_map[q_id],
            "feedbacks": []
        }
        for r in responses:
            answer_text = r.get("answers", {}).get(q_id)
            if answer_text:
                grouped_data[q_id]["feedbacks"].append({
                    "res_id": r["id"],
                    "text": answer_text
                })
    
    return grouped_data

def get_survey_structure(survey_id: int) -> dict | None:
    """Lấy cấu trúc content và cấu hình mục tiêu của khảo sát (Dùng cho AI)"""
    result = (
        supabase_client.table("surveys")
        .select("content, target_config")
        .eq("id", survey_id)
        .maybe_single()
        .execute()
    )
    return result.data

def get_all_responses_by_survey(survey_id: int) -> list[dict]:
    """Lấy tất cả phản hồi của một khảo sát (Dùng cho AI)"""
    result = (
        supabase_client.table("survey_responses")
        .select("id, answers")
        .eq("survey_id", survey_id)
        .execute()
    )
    return result.data or []