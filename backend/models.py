import enum
from sqlalchemy import (
    create_engine, Column, Integer, String, Enum as SQLAlchemyEnum, 
    ForeignKey, DateTime, Table, Boolean, func
)
from sqlalchemy.orm import relationship
import uuid
from database import Base

# Association Table for Many-to-Many relationship between Feedback and Tags
feedback_tags = Table('feedback_tags', Base.metadata,
    Column('feedback_id', String, ForeignKey('feedback.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

class RoleEnum(str, enum.Enum):
    manager = "manager"
    employee = "employee"

class SentimentEnum(str, enum.Enum):
    positive = "positive"
    negative = "negative"
    neutral = "neutral"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SQLAlchemyEnum(RoleEnum))
    manager_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    manager = relationship("User", remote_side=[id], back_populates="team_members")
    team_members = relationship("User", back_populates="manager")
    feedback_given = relationship("Feedback", foreign_keys='[Feedback.manager_id]', back_populates="manager")
    feedback_received = relationship("Feedback", foreign_keys='[Feedback.employee_id]', back_populates="employee")
    acknowledgements = relationship("Acknowledgement", back_populates="employee")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("users.id"))
    manager_id = Column(String, ForeignKey("users.id"))
    strengths = Column(String)
    improvements = Column(String)
    sentiment = Column(SQLAlchemyEnum(SentimentEnum))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    manager = relationship("User", foreign_keys=[manager_id], back_populates="feedback_given")
    employee = relationship("User", foreign_keys=[employee_id], back_populates="feedback_received")
    acknowledgment = relationship("Acknowledgement", back_populates="feedback", uselist=False, cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=feedback_tags, back_populates="feedbacks")

class Acknowledgement(Base):
    __tablename__ = "acknowledgements"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(String, ForeignKey("feedback.id"))
    employee_id = Column(String, ForeignKey("users.id"))
    acknowledged = Column(Boolean, default=False)
    comment = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    feedback = relationship("Feedback", back_populates="acknowledgment")
    employee = relationship("User", back_populates="acknowledgements")

class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    feedbacks = relationship("Feedback", secondary=feedback_tags, back_populates="tags")

class FeedbackRequest(Base):
    __tablename__ = "feedback_requests"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, ForeignKey("users.id"))
    manager_id = Column(String, ForeignKey("users.id"))
    message = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    is_open = Column(Boolean, default=True)

    employee = relationship("User", foreign_keys=[employee_id])
    manager = relationship("User", foreign_keys=[manager_id])