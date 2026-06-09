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
        GEMINI_API_KEY=os.environ.get("GEMNI_API_KEY")
        GEMINI_EMBEDING_MODEL=os.environ.get("GEMINI_EMBEDING_MODEL")
        GEMINI_GEN_MODEL=os.environ.get("GEMINI_GEN_MODEL")

finally:
    logger.info("ENV Load success")
