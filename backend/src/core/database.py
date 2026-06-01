from supabase import create_client, Client
from src.config.env import SUPABASE_URL, SUPABASE_KEY

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)