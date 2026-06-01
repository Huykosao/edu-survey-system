from fastapi import APIRouter, HTTPException

from src.models.auth import LoginRequest

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
    responses={404: {"description": "Not found"}}
)

@router.get("/test")
def test():
    return {"Test" : "Success"}

@router.post("/login")
def login(login_req: LoginRequest):
    return {"Body" : login_req.email}