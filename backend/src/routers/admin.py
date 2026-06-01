from fastapi import APIRouter, HTTPException

from src.models.admin import CreateUserRequest
from src.services.auth import create_user_services

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
    responses={404: {"description": "Not found"}}
)

@router.get("/test")
def test():
    return {"Test" : "Success"}

@router.post("/user")
def user(req: CreateUserRequest):
    return create_user_services(req)