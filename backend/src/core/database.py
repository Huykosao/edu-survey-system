import httpx
from supabase import create_client, Client, ClientOptions
from src.config.env import SUPABASE_URL, SUPABASE_KEY

# Disable HTTP/2 to prevent connection pooling and "Server disconnected" issues
custom_http_client = httpx.Client(http2=False)

supabase_client: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
    options=ClientOptions(httpx_client=custom_http_client)
)