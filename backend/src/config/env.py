from dotenv import load_dotenv
import os
from loguru import logger

load_dotenv()

try:
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

    ALLOWED_ORIGINS = (os.environ.get("ALLOWED_ORIGINS")).split(",")
    # logger.info(ALLOWED_ORIGINS)
finally:
    logger.info("ENV Load success")
