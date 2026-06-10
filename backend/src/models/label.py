from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class LabelBase(BaseModel):
    role_id: int
    label_name: str
    label_description: Optional[str] = None

class CreateLabelRequest(LabelBase):
    pass

class UpdateLabelRequest(LabelBase):
    pass

class LabelResponse(LabelBase):
    id: int
    created_at: datetime

class LabelListResponse(BaseModel):
    items: List[LabelResponse]
    total: int