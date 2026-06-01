from datetime import datetime, timezone
from zoneinfo import ZoneInfo

def get_current_timestamptz(tz_name: str = "Asia/Ho_Chi_Minh") -> datetime:
    """
    Returns the current timestamp with timezone info (like TIMESTAMPTZ in SQL).
    
    Args:
        tz_name (str): Timezone name (e.g., "UTC", "Asia/Ho_Chi_Minh").
    
    Returns:
        datetime: Timezone-aware datetime object.
    """
    try:
        tz = ZoneInfo(tz_name)
    except Exception as e:
        raise ValueError(f"Invalid timezone '{tz_name}': {e}")
    
    return datetime.now(tz)