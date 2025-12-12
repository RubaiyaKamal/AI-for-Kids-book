from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    software_experience: str
    hardware_experience: str
    interests: Optional[List[str]] = []

class UserLogin(UserBase):
    password: str

class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    software_experience: str
    hardware_experience: str
    interests: List[str]

class User(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    profile: Optional[UserProfile] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
