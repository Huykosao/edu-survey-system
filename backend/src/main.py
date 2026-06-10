"""
main.py
────────
Entry point FastAPI — đăng ký tất cả routers.
Mỗi router chỉ xử lý HTTP, không chứa business logic.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from src.config import env
from src.config.logging import setup_logging

from src.routers.auth import router as auth_router
from src.routers.users import router as users_router
from src.routers.master_data import router as master_data_router
from src.routers.surveys import router as surveys_router
from src.routers.clarifications import router as clarifications_router
from src.routers.notifications import router as notifications_router
from src.routers.dashboard import router as dashboard_router
from src.routers.improvements import router as improvements_router
from src.routers.allowed_domains import router as allowed_domains_router
from src.routers.ai import router as ai_router
from src.routers.label import router as label_router

app = FastAPI(
    title="Edu Survey System API",
    description="Hệ thống khảo sát giáo dục",
    version="1.0.0",
)

setup_logging()

app.add_middleware(
    CORSMiddleware,
    allow_origins=env.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──────────────────────────────────────────────────────────
app.include_router(auth_router)          # /auth/*
app.include_router(users_router)         # /api/users/*, /api/profile/*
app.include_router(master_data_router)   # /api/faculties/*, /api/majors/*, ...
app.include_router(surveys_router)       # /api/surveys/*, /api/my-surveys, ...
app.include_router(clarifications_router)# /api/clarifications/*, /api/responses-to-students/*, ...
app.include_router(notifications_router) # /api/notifications/*
app.include_router(dashboard_router)     # /api/dashboard/overview, /api/system-logs
app.include_router(improvements_router)  # /api/improvements/*
app.include_router(allowed_domains_router) # /api/allowed-domains/*
app.include_router(ai_router)
app.include_router(label_router)

@app.get("/")
def root():
    return {"service": "Edu Survey System", "status": "running"}


@app.get("/roles")
def get_roles():
    """Quick endpoint lấy danh sách roles (không cần auth)."""
    from src.core.database import supabase_client
    role_data = supabase_client.table("roles").select("*").execute()
    return {"data": role_data.data}
