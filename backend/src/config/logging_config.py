import sys
from loguru import logger


def setup_logging(debug: bool = False) -> None:
    """Configure loguru for structured, human-readable logging."""
    logger.remove()  # Remove default handler

    log_level = "DEBUG" if debug else "INFO"
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )

    logger.add(sys.stderr, level=log_level, format=log_format, colorize=True)