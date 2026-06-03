"""
repositories/master_data.py
────────────────────────────
Truy vấn DB cho dữ liệu danh mục: faculties, majors, classes, subjects.
"""

from fastapi import HTTPException
from src.core.database import supabase_client


# ── Faculties ─────────────────────────────────────────────────────────────────

def list_faculties() -> list[dict]:
    return supabase_client.table("faculties").select("*").order("name").execute().data or []


def create_faculty(name: str) -> dict:
    result = supabase_client.table("faculties").insert({"name": name}).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo khoa thất bại")
    return result.data[0]


def update_faculty(fid: int, name: str) -> dict:
    result = supabase_client.table("faculties").update({"name": name}).eq("id", fid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoa")
    return result.data[0]


def delete_faculty(fid: int) -> None:
    supabase_client.table("faculties").delete().eq("id", fid).execute()


# ── Majors ────────────────────────────────────────────────────────────────────

def list_majors() -> list[dict]:
    return (
        supabase_client.table("majors")
        .select("*, faculties(name)")
        .order("name")
        .execute()
        .data or []
    )


def create_major(name: str, faculty_id: int) -> dict:
    result = supabase_client.table("majors").insert(
        {"name": name, "faculty_id": faculty_id}
    ).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo ngành thất bại")
    return result.data[0]


def update_major(mid: int, data: dict) -> dict:
    result = supabase_client.table("majors").update(data).eq("id", mid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy ngành")
    return result.data[0]


def delete_major(mid: int) -> None:
    supabase_client.table("majors").delete().eq("id", mid).execute()


# ── Classes ───────────────────────────────────────────────────────────────────

def list_classes() -> list[dict]:
    return (
        supabase_client.table("classes")
        .select("*, majors(name)")
        .order("name")
        .execute()
        .data or []
    )


def create_class(name: str, major_id: int) -> dict:
    result = supabase_client.table("classes").insert(
        {"name": name, "major_id": major_id}
    ).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo lớp thất bại")
    return result.data[0]


def update_class(cid: int, data: dict) -> dict:
    result = supabase_client.table("classes").update(data).eq("id", cid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp")
    return result.data[0]


def delete_class(cid: int) -> None:
    supabase_client.table("classes").delete().eq("id", cid).execute()


# ── Subjects ──────────────────────────────────────────────────────────────────

def list_subjects() -> list[dict]:
    return (
        supabase_client.table("subjects")
        .select("*, faculties(name)")
        .order("name")
        .execute()
        .data or []
    )


def create_subject(code: str, name: str, faculty_id: int) -> dict:
    result = supabase_client.table("subjects").insert(
        {"code": code, "name": name, "faculty_id": faculty_id}
    ).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Tạo môn học thất bại")
    return result.data[0]


def update_subject(sid: int, data: dict) -> dict:
    result = supabase_client.table("subjects").update(data).eq("id", sid).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    return result.data[0]


def delete_subject(sid: int) -> None:
    supabase_client.table("subjects").delete().eq("id", sid).execute()
