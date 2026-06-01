from src.core.database import supabase_client
from src.schemas.user import NewUser
from fastapi import HTTPException

def create_user(new_user: NewUser):
    res = supabase_client.table("users").insert(
        new_user.model_dump(mode="json", exclude_none=True)
    ).execute()
    if not res.data: 
        raise HTTPException(status_code=500, detail="Failed to create product")
    return res.data[0]