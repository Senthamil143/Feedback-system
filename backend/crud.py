from sqlalchemy.orm import Session
import models, schemas

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email.ilike(email)).first()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_feedback(db: Session, feedback: schemas.FeedbackCreate):
    db_feedback = models.Feedback(**feedback.dict())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_feedback_for_employee(db: Session, employee_id: str):
    return db.query(models.Feedback).filter(models.Feedback.employee_id == employee_id).all()

def get_feedback_for_manager(db: Session, manager_id: str):
    return db.query(models.Feedback).filter(models.Feedback.manager_id == manager_id).all()

def acknowledge_feedback(db: Session, feedback_id: str, employee_id: str, comment: str = None):
    ack = models.Acknowledgement(feedback_id=feedback_id, employee_id=employee_id, acknowledged=True, comment=comment)
    db.merge(ack)
    db.commit()
    return ack