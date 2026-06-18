"""
core/limiter.py
───────────────
Cấu hình giới hạn tần suất yêu cầu (rate limiter) chống spam bằng slowapi.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

# Định vị người dùng dựa trên IP của họ để giới hạn truy cập
limiter = Limiter(key_func=get_remote_address)


def rate_limit_error_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom error handler cho rate limit
    Trả về thông báo tiếng Việt thân thiện với người dùng
    """
    retry_after = getattr(exc, "retry_after", 60) or 60
    hours = int(retry_after // 3600)
    minutes = int((retry_after % 3600) // 60)
    
    if hours > 0:
        msg = f"Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau {hours} giờ {minutes} phút."
    elif minutes > 0:
        msg = f"Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau {minutes} phút."
    else:
        msg = f"Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau {retry_after} giây."
    
    return JSONResponse(
        status_code=429,
        content={"detail": msg}
    )
