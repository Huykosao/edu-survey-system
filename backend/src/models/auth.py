from pydantic import BaseModel
from src.share.types import ValidEmail

class LoginRequest(BaseModel):
    email: ValidEmail
    password: str
