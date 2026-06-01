from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import env
from src.core.database import supabase_client
from src.config.logging import setup_logging

from src.routers.auth import router as auth_router
from src.routers.admin import router as admin_router
from loguru import logger

app = FastAPI()
setup_logging()

app.add_middleware(
    CORSMiddleware,
    allow_origins=env.ALLOWED_ORIGINS, # Specific origins
    allow_credentials=True, # Allow cookies/auth headers
    allow_methods=["*"], # Allow all HTTP methods
    allow_headers=["*"], # Allow all headers
)

app.include_router(auth_router)
app.include_router(admin_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

@app.get("/roles")
def get_roles():
    role_data = supabase_client.table("roles").select("*").execute()
    return {"data" : role_data.data}