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

finally:
    logger.info("ENV Load success")
