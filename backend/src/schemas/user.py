from pydantic import BaseModel, Field
from src.share.types import ValidEmail, UserStatus
from datetime import datetime
from src.share.utils import time

# CREATE TABLE public.users (
#     id SERIAL PRIMARY KEY,
#     username VARCHAR(100) UNIQUE NOT NULL, -- Mã định danh hoặc Username được cấp
#     password_hash TEXT NOT NULL,           
#     email VARCHAR(255) UNIQUE NOT NULL,
#     full_name VARCHAR(255),
#     status public.user_status DEFAULT 'active',
#     last_login TIMESTAMPTZ,
#     created_at TIMESTAMPTZ DEFAULT now(),
#     updated_at TIMESTAMPTZ DEFAULT now()
# );

class User(BaseModel):
    id: int
    username: str = Field(..., max_length=100)
    password_hash: str
    email: ValidEmail = Field(..., max_length=255)
    full_name: str = Field(..., max_length=255)
    status: UserStatus
    last_login: datetime
    created_at: datetime
    updated_at: datetime

current_time = time.get_current_timestamptz()

class NewUser(BaseModel):
    username: str = Field(..., max_length=100)
    password_hash: str
    email: ValidEmail = Field(..., max_length=255)
    full_name: str = Field(..., max_length=255)
    last_login: datetime = current_time
    created_at: datetime = current_time
    updated_at: datetime = current_time
    
