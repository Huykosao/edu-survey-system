from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AllowedDomainRequest(BaseModel):
    """Body POST/PUT for allowed domains."""
    domain: str = Field(..., min_length=3, max_length=255, pattern=r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    description: Optional[str] = None

class AllowedDomainResponse(BaseModel):
    """Response model for allowed domains."""
    id: int
    domain: str
    description: Optional[str] = None
    created_at: datetime
