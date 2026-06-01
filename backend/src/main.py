from fastapi import FastAPI
from src.core.database import supabase_client

app = FastAPI()


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