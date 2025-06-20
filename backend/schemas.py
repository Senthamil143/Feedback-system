from pydantic import BaseModel
from typing import Optional
from enum import Enum

class RoleEnum(str, Enum):
    manager = "manager"
    employee = "employee"

class SentimentEnum(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"

class UserBase(BaseModel):
    name: str
    email: str
    role: RoleEnum

class UserCreate(UserBase):
    pass

class UserOut(UserBase):
    id: str

class FeedbackBase(BaseModel):
    strengths: str
    improvements: str
    sentiment: SentimentEnum

class FeedbackCreate(FeedbackBase):
    employee_id: str
    manager_id: str

class FeedbackOut(FeedbackBase):
    id: str
    created_at: str
    updated_at: str
    manager_id: str

class AcknowledgementIn(BaseModel):
    comment: Optional[str] = None