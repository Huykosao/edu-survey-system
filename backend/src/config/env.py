from dotenv import load_dotenv
import os
from loguru import logger

load_dotenv()

try:
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

    ALLOWED_ORIGINS = (os.environ.get("ALLOWED_ORIGINS")).split(",")
    # logger.info(ALLOWED_ORIGINS)

    AI_ENABLE=os.environ.get("AI_ENABLE")
    if AI_ENABLE:
        GEMINI_API_KEY=os.environ.get("GEMINI_API_KEY")
        GEMINI_EMBEDING_MODEL=os.environ.get("GEMINI_EMBEDING_MODEL")
        GEMINI_MODEL=os.environ.get("GEMINI_MODEL") or os.environ.get("GEMINI_GEN_MODEL") or "gemini-2.5-flash"
        MODEL_CONTEXT_WINDOW=32000

    # SMTP Configuration
    SMTP_HOST = os.environ.get("SMTP_HOST")
    SMTP_PORT = int(os.environ.get("SMTP_PORT") or 587)
    SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
    SMTP_SENDER = os.environ.get("SMTP_SENDER") or os.environ.get("SMTP_USERNAME")
    SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"
    SMTP_USE_SSL = os.environ.get("SMTP_USE_SSL", "false").lower() == "true"
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

finally:
    logger.info("ENV Load success")
