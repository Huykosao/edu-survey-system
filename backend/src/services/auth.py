from src.models.admin import CreateUserRequest
from src.schemas.user import NewUser
from src.repositories.user import create_user
import bcrypt

def hash_password(plain_password: str) -> bytes:
    """
    Hash a plain text password using bcrypt.
    Returns the hashed password as bytes.
    """
    if not isinstance(plain_password, str) or not plain_password:
        raise ValueError("Password must be a non-empty string.")
    
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()  # Automatically generates a secure random salt
    hashed = bcrypt.hashpw(plain_password.encode('utf-8'), salt)
    return hashed

def verify_password(plain_password: str, hashed_password: bytes) -> bool:
    """
    Verify a plain text password against the stored hashed password.
    """
    if not isinstance(plain_password, str) or not plain_password:
        return False
    if not isinstance(hashed_password, bytes):
        return False
    
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)



def create_user_services(user: CreateUserRequest):
    try:
        save_user = NewUser(
            full_name=user.full_name,
            email=user.email,
            password_hash=hash_password(user.password),
            username=(user.email.split("@"))[0]
        )

        return create_user(save_user)

    except Exception:
        raise Exception