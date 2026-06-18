"""
repositories/allowed_domain.py
──────────────────────────────
Truy vấn DB cho danh sách các tên miền email được phép.
"""

from fastapi import HTTPException
from src.core.database import supabase_client


def list_allowed_domains() -> list[dict]:
    """Lấy danh sách các tên miền được phép."""
    result = supabase_client.table("allowed_domains").select("*").order("domain").execute()
    return result.data or []


def get_allowed_domain_by_id(domain_id: int) -> dict | None:
    """Lấy chi tiết một tên miền theo ID."""
    result = supabase_client.table("allowed_domains").select("*").eq("id", domain_id).execute()
    return result.data[0] if result.data else None


def create_allowed_domain(domain: str, description: str | None) -> dict:
    """Thêm một tên miền mới."""
    result = (
        supabase_client.table("allowed_domains")
        .insert({"domain": domain, "description": description})
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Thêm tên miền thất bại")
    return result.data[0]


def update_allowed_domain(domain_id: int, data: dict) -> dict:
    """Cập nhật thông tin tên miền."""
    result = (
        supabase_client.table("allowed_domains")
        .update(data)
        .eq("id", domain_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy tên miền")
    return result.data[0]


def delete_allowed_domain(domain_id: int) -> None:
    """Xóa tên miền khỏi danh sách."""
    result = supabase_client.table("allowed_domains").delete().eq("id", domain_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy tên miền để xóa")
