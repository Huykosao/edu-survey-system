from typing import Annotated
from pydantic import AfterValidator, EmailStr

import time
from src.core.database import supabase_client

_allowed_domains_cache = None
_allowed_domains_last_fetch = 0
CACHE_TTL = 60  # Cache for 60 seconds

def get_allowed_domains() -> set[str]:
    global _allowed_domains_cache, _allowed_domains_last_fetch
    now = time.time()
    if _allowed_domains_cache is None or now - _allowed_domains_last_fetch > CACHE_TTL:
        try:
            res = supabase_client.table("allowed_domains").select("domain").execute()
            if res.data:
                _allowed_domains_cache = {item["domain"] for item in res.data}
            else:
                _allowed_domains_cache = {"example.com", "mycompany.com"}
        except Exception:
            # Fallback if the table doesn't exist or there is a database issue
            _allowed_domains_cache = {"example.com", "mycompany.com", "edu.vn", "student.edu.vn"}
        _allowed_domains_last_fetch = now
    return _allowed_domains_cache

ValidEmail = EmailStr


from enum import Enum

class UserStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOCKED = "locked"