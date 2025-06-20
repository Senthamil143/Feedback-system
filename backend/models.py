from sqlalchemy import Column, String, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from database import Base

class RoleEnum(str, enum.Enum):
    manager = "manager"
    employee = "employee"

class SentimentEnum(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("users.id"))
    manager_id = Column(String, ForeignKey("users.id"))
    strengths = Column(String)
    improvements = Column(String)
    sentiment = Column(Enum(SentimentEnum))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Acknowledgement(Base):
    __tablename__ = "acknowledgements"

    feedback_id = Column(String, ForeignKey("feedback.id"), primary_key=True)
    employee_id = Column(String, ForeignKey("users.id"), primary_key=True)
    acknowledged = Column(Boolean, default=False)
    comment = Column(String, nullable=True)