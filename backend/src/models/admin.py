from pydantic import BaseModel, Field
from src.share.types import ValidEmail

class CreateUserRequest(BaseModel):
    password: str
    email: ValidEmail = Field(..., max_length=255)
    full_name: str = Field(..., max_length=255)

class BulkCreateUser(BaseModel):
    users: list[CreateUserRequest]