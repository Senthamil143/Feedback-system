from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime
from models import RoleEnum, SentimentEnum

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int

    model_config = ConfigDict(orm_mode=True)

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum

class UserCreate(UserBase):
    password: str
    manager_id: Optional[str] = None

class UserOut(UserBase):
    id: str
    manager_id: Optional[str] = None

    model_config = ConfigDict(orm_mode=True)

class EmployeeInfo(BaseModel):
    id: str
    name: str
    email: str

class FeedbackBase(BaseModel):
    strengths: str
    improvements: str
    sentiment: SentimentEnum

class FeedbackCreate(FeedbackBase):
    employee_id: str
    tag_ids: Optional[List[int]] = []

class FeedbackUpdate(BaseModel):
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    sentiment: Optional[SentimentEnum] = None

class AcknowledgementOut(BaseModel):
    acknowledged: bool
    comment: Optional[str]
    acknowledged_at: datetime

    model_config = ConfigDict(orm_mode=True)

class FeedbackOut(FeedbackBase):
    id: str
    employee_id: str
    manager_id: str
    created_at: datetime
    updated_at: datetime
    employee: Optional[UserOut] = None
    acknowledgment: Optional[AcknowledgementOut] = None
    tags: List[Tag] = []

    model_config = ConfigDict(orm_mode=True)

class AcknowledgementIn(BaseModel):
    comment: Optional[str] = None

class FeedbackRequestBase(BaseModel):
    message: Optional[str] = None

class FeedbackRequestCreate(FeedbackRequestBase):
    pass

class FeedbackRequestOut(FeedbackRequestBase):
    id: int
    employee_id: str
    manager_id: str
    created_at: datetime
    is_open: bool
    employee: UserOut

    model_config = ConfigDict(orm_mode=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None