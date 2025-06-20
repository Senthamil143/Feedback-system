from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import crud, models, schemas
from database import SessionLocal, engine, Base
from typing import List
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
Base.metadata.create_all(bind=engine)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:5174"] for dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- User Endpoints ---
@app.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)

@app.get("/manager/{manager_id}/team", response_model=List[schemas.UserOut])
def get_team_members(manager_id: str, db: Session = Depends(get_db)):
    # For demo: all employees (in real app, filter by manager's team)
    return db.query(models.User).filter(models.User.role == models.RoleEnum.employee).all()

@app.get("/users/by_email/{email}", response_model=schemas.UserOut)
def get_user_by_email_endpoint(email: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- Feedback Endpoints ---
@app.post("/feedback/", response_model=schemas.FeedbackOut)
def submit_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    return crud.create_feedback(db, feedback)

@app.get("/feedback/employee/{employee_id}", response_model=List[schemas.FeedbackOut])
def get_feedback(employee_id: str, db: Session = Depends(get_db)):
    return crud.get_feedback_for_employee(db, employee_id)

@app.get("/feedback/manager/{manager_id}", response_model=List[schemas.FeedbackOut])
def get_feedback(manager_id: str, db: Session = Depends(get_db)):
    return crud.get_feedback_for_manager(db, manager_id)

@app.put("/feedback/{feedback_id}", response_model=schemas.FeedbackOut)
def update_feedback(feedback_id: str, feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    db_feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    for key, value in feedback.dict().items():
        setattr(db_feedback, key, value)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@app.post("/feedback/{feedback_id}/acknowledge")
def acknowledge(feedback_id: str, ack: schemas.AcknowledgementIn, employee_id: str, db: Session = Depends(get_db)):
    return crud.acknowledge_feedback(db, feedback_id, employee_id, ack.comment)

# --- Dashboard Endpoints ---
@app.get("/dashboard/manager/{manager_id}")
def manager_dashboard(manager_id: str, db: Session = Depends(get_db)):
    feedbacks = crud.get_feedback_for_manager(db, manager_id)
    count = len(feedbacks)
    sentiments = {s.value: 0 for s in models.SentimentEnum}
    for fb in feedbacks:
        sentiments[fb.sentiment.value] += 1
    return {"feedback_count": count, "sentiment_trends": sentiments}

@app.get("/dashboard/employee/{employee_id}")
def employee_dashboard(employee_id: str, db: Session = Depends(get_db)):
    feedbacks = crud.get_feedback_for_employee(db, employee_id)
    return {"timeline": feedbacks}

# --- Static files for frontend ---
dist_path = os.path.join("frontend", "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
