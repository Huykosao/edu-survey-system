from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from src.core.middleware import require_admin_or_manager
from src.models.auth import MessageResponse
from src.models.gemini import FinalSurveyReport
from src.services.ai import (
    classify_survey_process,
    generate_trend_analysis
)

router = APIRouter(
    prefix="/api/surveys",
    tags=["AI Analysis"],
    responses={404: {"description": "Not found"}},
)

# ── AI Classification ────────────────────────────────────────────────────────

@router.post("/{survey_id}/ai-classify", response_model=MessageResponse)
def run_ai_classification(
    survey_id: int,
    # Chuyển từ role (string) sang role_id (int) và để Optional
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
        # Gọi service với role_id (có thể là None để service tự xử lý)
        count = classify_survey_process(survey_id, role_id)
        
        if count == 0:
            return {
                "message": f"Không tìm thấy phản hồi hoặc nhãn phù hợp để phân loại cho khảo sát #{survey_id}."
            }
            
        return {
            "message": f"AI đã hoàn thành phân loại {count} nhãn cho bài khảo sát #{survey_id}."
        }
    except ValueError as ve:
        # Bắt các lỗi logic như không tìm thấy Survey hoặc Role ID
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