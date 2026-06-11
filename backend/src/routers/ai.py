from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List

from src.core.middleware import require_admin_or_manager
from src.models.auth import MessageResponse
from src.models.gemini import FinalSurveyReport
from src.services.ai import (
    classify_survey_process,
    generate_trend_analysis
)
from src.repositories import ai_report as ai_report_repo
from src.core.database import supabase_client

router = APIRouter(
    prefix="/api/surveys",
    tags=["AI Analysis"],
    responses={404: {"description": "Not found"}},
)

# ── AI Classification ────────────────────────────────────────────────────────

@router.post("/{survey_id}/ai-classify", response_model=MessageResponse)
def run_ai_classification(
    survey_id: int,
    role_id: Optional[int] = Query(
        None, 
        description="ID của Role để lấy nhãn. Nếu để trống, hệ thống tự lấy từ cấu hình khảo sát."
    ),
    _: dict = Depends(require_admin_or_manager)
):
    """
    Tiến hành quét toàn bộ phản hồi mở của bài khảo sát, gom nhóm theo câu hỏi 
    và gọi AI gán nhãn + phân loại cảm xúc.
    [MANAGER, ADMIN]
    """
    try:
        count = classify_survey_process(survey_id, role_id)
        
        if count == 0:
            return {
                "message": f"Không tìm thấy phản hồi hoặc nhãn phù hợp để phân loại cho khảo sát #{survey_id}."
            }
            
        return {
            "message": f"AI đã hoàn thành phân loại {count} nhãn cho bài khảo sát #{survey_id}."
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Lỗi hệ thống khi chạy AI Classification: {str(e)}"
        )


# ── AI Trend Analysis ────────────────────────────────────────────────────────

@router.post("/{survey_id}/ai-report", response_model=FinalSurveyReport)
def run_ai_trend_analysis(
    survey_id: int,
    _: dict = Depends(require_admin_or_manager)
):
    """
    Dựa trên dữ liệu định lượng (điểm số) và định tính (nhãn đã gán), 
    AI lập báo cáo tóm tắt xu hướng và gợi ý giải pháp.
    [MANAGER, ADMIN]
    """
    try:
        report = generate_trend_analysis(survey_id)
        return report
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Lỗi khi khởi tạo AI Report: {str(e)}"
        )


# ── GET Saved AI Report ───────────────────────────────────────────────────────

@router.get("/{survey_id}/ai-report")
def get_ai_report(
    survey_id: int,
    _: dict = Depends(require_admin_or_manager)
):
    """
    Lấy báo cáo AI đã lưu gần nhất của khảo sát.
    [MANAGER, ADMIN]
    """
    try:
        result = (
            supabase_client
            .table("survey_reports")
            .select("*")
            .eq("survey_id", survey_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy báo cáo AI: {str(e)}")


# ── GET AI Dashboard Overview ─────────────────────────────────────────────────

@router.get("/{survey_id}/ai-overview")
def get_ai_overview(
    survey_id: int,
    _: dict = Depends(require_admin_or_manager)
):
    """
    Lấy thông tin tổng quan AI (số nhãn, sentiment, số phản hồi mở) của khảo sát.
    Bao gồm cả label_summary (phân tích theo nhãn) và question_sentiment_summary.
    [MANAGER, ADMIN]
    """
    try:
        overview = ai_report_repo.get_dashboard_overview(survey_id)
        label_summary = ai_report_repo.get_label_sentiment_summary(survey_id)
        question_summary = ai_report_repo.get_question_sentiment_summary(survey_id)
        return {
            "overview": overview,
            "label_summary": label_summary,
            "question_summary": question_summary,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy tổng quan AI: {str(e)}")


# ── GET Feedbacks Grouped By Label ──────────────────────────────────────────

@router.get("/{survey_id}/ai-feedback-by-label")
def get_ai_feedback_by_label(
    survey_id: int,
    _: dict = Depends(require_admin_or_manager)
):
    """
    Lấy danh sách các phản hồi mở được gom nhóm theo nhãn AI đã gán.
    [MANAGER, ADMIN]
    """
    try:
        feedbacks = ai_report_repo.get_feedback_examples(survey_id)
        grouped = {}
        for fb in feedbacks:
            lbl = fb.get("label_name")
            if not lbl:
                continue
            if lbl not in grouped:
                grouped[lbl] = []
            grouped[lbl].append({
                "feedback_text": fb.get("feedback_text"),
                "sentiment": fb.get("sentiment"),
                "question_id": fb.get("question_id")
            })
        return grouped
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy phản hồi theo nhãn: {str(e)}")
