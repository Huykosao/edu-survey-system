from typing import Annotated
from pydantic import AfterValidator, EmailStr

def check_domain(email: EmailStr)  -> EmailStr:
    allowed_domains = {"example.com", "mycompany.com"}
    domain = email.split("@")[-1]
    if domain not in allowed_domains:
        raise ValueError(f"Email domain '{domain}' is not allowed.")
    return email

ValidEmail = Annotated[EmailStr, AfterValidator(check_domain)]


from enum import Enum

class UserStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOCKED = "locked"