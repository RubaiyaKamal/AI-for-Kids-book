from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, JSON, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Background Info
    software_experience = Column(String) # e.g., Beginner, Intermediate, Expert
    hardware_experience = Column(String) # e.g., Arduino, Raspberry Pi, None

    # Additional fields for personalization
    interests = Column(JSON, default=list) # e.g., ["ROS", "Computer Vision"]

    user = relationship("User", back_populates="profile")
