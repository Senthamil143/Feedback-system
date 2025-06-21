from sqlalchemy.orm import Session, joinedload
import models, schemas
from passlib.context import CryptContext
from datetime import datetime
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        email=user.email, 
        name=user.name, 
        hashed_password=hashed_password, 
        role=user.role,
        manager_id=user.manager_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_team_members(db: Session, manager_id: str):
    """Get all employees assigned to a specific manager"""
    return db.query(models.User).filter(
        models.User.role == models.RoleEnum.employee,
        models.User.manager_id == manager_id
    ).all()

def assign_employee_to_manager(db: Session, employee_id: str, manager_id: str):
    """Assign an employee to a manager"""
    employee = db.query(models.User).filter(models.User.id == employee_id).first()
    if employee and employee.role == models.RoleEnum.employee:
        employee.manager_id = manager_id
        db.commit()
        db.refresh(employee)
        return employee
    return None

def get_available_employees(db: Session):
    """Get all employees not assigned to any manager"""
    return db.query(models.User).filter(
        models.User.role == models.RoleEnum.employee,
        models.User.manager_id.is_(None)
    ).all()

def get_feedback_by_manager(db: Session, manager_id: str):
    return db.query(models.Feedback).filter(models.Feedback.manager_id == manager_id).all()

def get_feedback_for_employee(db: Session, employee_id: str):
    return db.query(models.Feedback).filter(models.Feedback.employee_id == employee_id).options(joinedload(models.Feedback.tags)).all()

def create_feedback(db: Session, feedback: schemas.FeedbackCreate, manager_id: str):
    db_feedback = models.Feedback(
        strengths=feedback.strengths,
        improvements=feedback.improvements,
        sentiment=feedback.sentiment,
        employee_id=feedback.employee_id,
        manager_id=manager_id
    )
    
    if feedback.tag_ids:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(feedback.tag_ids)).all()
        db_feedback.tags.extend(tags)

    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_feedback_for_manager(db: Session, manager_id: str):
    return db.query(models.Feedback).filter(models.Feedback.manager_id == manager_id).options(joinedload(models.Feedback.tags)).all()

def acknowledge_feedback(db: Session, feedback_id: str, comment: str):
    db_acknowledgement = db.query(models.Acknowledgement).filter(models.Acknowledgement.feedback_id == feedback_id).first()

    if not db_acknowledgement:
        db_acknowledgement = models.Acknowledgement(feedback_id=feedback_id)
        db.add(db_acknowledgement)

    db_acknowledgement.acknowledged = True
    db_acknowledgement.comment = comment
    db_acknowledgement.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(db_acknowledgement)
    return db_acknowledgement

def get_acknowledgement(db: Session, feedback_id: str, user_id: str):
    return db.query(models.Acknowledgement).filter(
        models.Acknowledgement.feedback_id == feedback_id, 
        models.Acknowledgement.employee_id == user_id
    ).first()

def get_feedback_with_acknowledgements(db: Session, manager_id: str):
    """Get feedback with acknowledgment information for managers"""
    return db.query(models.Feedback).options(
        joinedload(models.Feedback.employee),
        joinedload(models.Feedback.acknowledgements)
    ).filter(models.Feedback.manager_id == manager_id).all()

def get_employee_feedback_with_acknowledgements(db: Session, employee_id: str):
    """Get feedback with acknowledgment information for employees"""
    return db.query(models.Feedback).options(
        joinedload(models.Feedback.acknowledgements)
    ).filter(models.Feedback.employee_id == employee_id).all()

def get_feedback_by_id(db: Session, feedback_id: str):
    """Get a specific feedback by ID with employee information"""
    return db.query(models.Feedback).options(
        joinedload(models.Feedback.employee)
    ).filter(models.Feedback.id == feedback_id).first()

def update_feedback(db: Session, feedback_id: str, feedback_update: schemas.FeedbackUpdate):
    db_feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if db_feedback:
        update_data = feedback_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_feedback, key, value)
        db_feedback.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_feedback)
    return db_feedback

def get_manager_dashboard_stats(db: Session, manager_id: str):
    """Get comprehensive dashboard statistics including acknowledgments"""
    feedbacks = db.query(models.Feedback).options(
        joinedload(models.Feedback.acknowledgements)
    ).filter(models.Feedback.manager_id == manager_id).all()
    
    count = len(feedbacks)
    sentiments = {s.value: 0 for s in models.SentimentEnum}
    acknowledged_count = 0
    
    for fb in feedbacks:
        sentiments[fb.sentiment.value] += 1
        if fb.acknowledgements and len(fb.acknowledgements) > 0:
            acknowledged_count += 1
    
    return {
        "feedback_count": count,
        "acknowledged_count": acknowledged_count,
        "pending_acknowledgment": count - acknowledged_count,
        "acknowledgment_rate": round((acknowledged_count / count * 100) if count > 0 else 0, 1),
        "sentiment_trends": sentiments
    }

def get_tags(db: Session):
    return db.query(models.Tag).all()

def get_or_create_tags(db: Session, tag_names: list[str]) -> list[models.Tag]:
    created_tags = []
    for name in tag_names:
        tag = db.query(models.Tag).filter(models.Tag.name == name).first()
        if not tag:
            tag = models.Tag(name=name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        created_tags.append(tag)
    return created_tags

def create_feedback_request(db: Session, employee_id: str, manager_id: str, message: Optional[str] = None):
    db_request = models.FeedbackRequest(
        employee_id=employee_id,
        manager_id=manager_id,
        message=message
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def get_open_feedback_requests(db: Session, manager_id: str):
    return db.query(models.FeedbackRequest).options(
        joinedload(models.FeedbackRequest.employee)
    ).filter(
        models.FeedbackRequest.manager_id == manager_id,
        models.FeedbackRequest.is_open == True
    ).all()

def close_feedback_request(db: Session, request_id: int):
    db_request = db.query(models.FeedbackRequest).filter(models.FeedbackRequest.id == request_id).first()
    if db_request:
        db_request.is_open = False
        db.commit()
        db.refresh(db_request)
    return db_request

def get_feedback_details(db: Session, feedback_id: str):
    return db.query(models.Feedback).options(
        joinedload(models.Feedback.employee),
        joinedload(models.Feedback.manager),
        joinedload(models.Feedback.tags),
        joinedload(models.Feedback.acknowledgment)
    ).filter(models.Feedback.id == feedback_id).first()