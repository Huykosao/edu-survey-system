"""
models/admin.py
────────────────
Giữ lại alias ngắn để không vỡ import cũ.
Các models chính đã chuyển qua models/user.py.
"""

from src.models.user import CreateUserRequest, BulkCreateUserRequest

# Alias tương thích ngược
BulkCreateUser = BulkCreateUserRequest