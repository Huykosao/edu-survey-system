from src.repositories import label as repo

def list_labels_service(role_id: int):
    items = repo.get_labels_by_role(role_id)
    return {"items": items, "total": len(items)}

def create_label_service(data: dict):
    return repo.create_label(data)
