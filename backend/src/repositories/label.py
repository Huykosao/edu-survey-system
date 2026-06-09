from src.core.database import supabase_client

TABLE = "survey_label_definitions"

def get_labels_by_role(role_id: int):
    """Lấy danh sách nhãn theo role_id"""
    result = (
        supabase_client.table(TABLE)
        .select("*")
        .eq("role_id", role_id)
        .order("id")
        .execute()
    )
    return result.data or []

def create_label(data: dict):
    """Data gồm: role_id, label_name, label_description"""
    result = supabase_client.table(TABLE).insert(data).execute()
    return result.data[0] if result.data else None

def update_label(label_id: int, data: dict):
    result = supabase_client.table(TABLE).update(data).eq("id", label_id).execute()
    return result.data[0] if result.data else None

def delete_label(label_id: int):
    supabase_client.table(TABLE).delete().eq("id", label_id).execute()