from pydantic import BaseModel, Json, EmailStr, Field, validator
from typing import Optional
import re

class VendorEdit(BaseModel):
    name: str
    address: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: str
    website: Optional[str] = None
    type: str

    @validator('contact_phone')
    def validate_phone(cls, v):

        # Check for empty or whitespace-only input
        if not v or not v.strip():
            raise ValueError('Phone number cannot be empty or contain only spaces')

        if not re.match(r'^[\d\s\+\-\(\)\.]*$', v):
            raise ValueError('Phone number can only contain digits, spaces, +, -, (), and . characters')
        return v


class Vendor(VendorEdit):
    id: int


