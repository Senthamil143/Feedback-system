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
    class ConfigDict:
        from_attributes = True

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
    class ConfigDict:
        from_attributes = True

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
    class ConfigDict:
        from_attributes = True

class FeedbackOut(FeedbackBase):
    id: str
    employee_id: str
    manager_id: str
    created_at: datetime
    updated_at: datetime
    acknowledgment: Optional[AcknowledgementOut] = None
    tags: List[Tag] = []
    class ConfigDict:
        from_attributes = True

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
    class ConfigDict:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None