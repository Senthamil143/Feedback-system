from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import crud, models, schemas, auth
from database import SessionLocal, engine, Base
from typing import List, Optional
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from weasyprint import HTML
import io
from contextlib import asynccontextmanager

# Import models before anything else to ensure they are registered with Base
import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    print("Application startup: Checking database...")
    db = SessionLocal()
    try:
        # Check if tags already exist to prevent re-seeding
        tags_exist = db.query(models.Tag).first()
        if not tags_exist:
            print("No tags found. Seeding initial tags.")
            tags_to_create = ["Leadership", "Communication", "Teamwork", "Technical Skills", "Problem Solving"]
            crud.get_or_create_tags(db, tags_to_create)
            print("Initial tags seeded successfully.")
        else:
            print("Tags already exist in the database. Skipping seeding.")
    finally:
        db.close()
    
    yield
    # Code to run on shutdown
    print("Application shutdown.")

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(lifespan=lifespan)

# CORS middleware
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://feedback-system-frontend.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use the same password context as crud.py
pwd_context = crud.pwd_context

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- User Endpoints ---
@app.post("/users", response_model=schemas.UserOut, tags=["Users"])
@app.post("/users/", response_model=schemas.UserOut, tags=["Users"], include_in_schema=False)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud.create_user(db=db, user=user)

@app.get("/manager/{manager_id}/team", response_model=List[schemas.UserOut])
def get_team_members(manager_id: str, db: Session = Depends(get_db), current_user: schemas.UserOut = Depends(auth.get_current_user)):
    if manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to view this team")
    # Now returns only employees assigned to this specific manager
    return crud.get_team_members(db, manager_id)

@app.get("/users/by_email/{email}", response_model=schemas.UserOut)
def get_user_by_email_endpoint(email: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- Team Management Endpoints ---
@app.get("/manager/{manager_id}/available-employees", response_model=List[schemas.UserOut])
def get_available_employees(manager_id: str, db: Session = Depends(get_db)):
    """Get all employees not assigned to any manager"""
    return crud.get_available_employees(db)

@app.post("/manager/{manager_id}/assign-employee/{employee_id}")
def assign_employee_to_manager(manager_id: str, employee_id: str, db: Session = Depends(get_db)):
    """Assign an employee to a manager"""
    result = crud.assign_employee_to_manager(db, employee_id, manager_id)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to assign employee to manager")
    return {"message": "Employee assigned successfully"}

# --- Feedback Endpoints ---
@app.post("/seed-db")
def seed_db(db: Session = Depends(get_db)):
    """Seed the database with some initial data."""
    tags_to_create = ["Leadership", "Communication", "Teamwork", "Technical Skills", "Problem Solving"]
    crud.get_or_create_tags(db, tags_to_create)
    return {"message": "Database seeded successfully with tags."}

@app.get("/")
def read_root():
    return {"message": "Feedback System API is running"}

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"Login attempt for email: {form_data.username}")
    
    user = crud.get_user_by_email(db, email=form_data.username)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found, please register first.")
    
    # Verify password using local pwd_context
    if not auth.verify_password(form_data.password, user.hashed_password):
        print(f"Password verification failed for user: {form_data.username}")
        print(f"Input password: {form_data.password}")
        print(f"Stored hash: {user.hashed_password}")
        print(f"Hash length: {len(user.hashed_password) if user.hashed_password else 0}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"Password verified successfully for user: {user.email}")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/reset-password/{email}")
def reset_user_password(email: str, new_password: str, db: Session = Depends(get_db)):
    """Reset a user's password (for debugging purposes)"""
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash the new password
    hashed_password = pwd_context.hash(new_password)
    user.hashed_password = hashed_password
    db.commit()
    db.refresh(user)
    
    print(f"Password reset for user: {email}")
    print(f"New hash: {hashed_password}")
    
    return {"message": "Password reset successfully"}

@app.post("/feedback/", response_model=schemas.FeedbackOut)
def create_feedback(
    feedback: schemas.FeedbackCreate, 
    request_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    if current_user.role != schemas.RoleEnum.manager:
        raise HTTPException(status_code=403, detail="Only managers can create feedback")
    
    new_feedback = crud.create_feedback(db=db, feedback=feedback, manager_id=current_user.id)
    
    if request_id:
        crud.close_feedback_request(db, request_id)
        
    return new_feedback

@app.get("/feedback/employee/", response_model=List[schemas.FeedbackOut])
def get_feedback_for_employee(
    db: Session = Depends(get_db), 
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    if current_user.role != schemas.RoleEnum.employee:
        raise HTTPException(status_code=403, detail="Only employees can view their feedback timeline")
    return crud.get_feedback_for_employee(db, employee_id=current_user.id)

@app.get("/feedback/manager/", response_model=List[schemas.FeedbackOut])
def get_feedback_for_manager(
    db: Session = Depends(get_db), 
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    if current_user.role != schemas.RoleEnum.manager:
        raise HTTPException(status_code=403, detail="Only managers can view their sent feedback")
    return crud.get_feedback_for_manager(db, manager_id=current_user.id)

@app.get("/feedback/{feedback_id}", response_model=schemas.FeedbackOut)
def get_feedback_by_id(feedback_id: str, db: Session = Depends(get_db)):
    """Get a specific feedback by ID"""
    feedback = crud.get_feedback_by_id(db, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback

@app.put("/feedback/{feedback_id}", response_model=schemas.FeedbackOut)
def update_feedback(
    feedback_id: str,
    feedback: schemas.FeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    if current_user.role != schemas.RoleEnum.manager:
        raise HTTPException(status_code=403, detail="Only managers can update feedback")
    
    db_feedback = crud.update_feedback(db, feedback_id=feedback_id, feedback_update=feedback)
    if db_feedback is None:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@app.post("/feedback/{feedback_id}/acknowledge", response_model=schemas.AcknowledgementOut)
def acknowledge_feedback(
    feedback_id: str,
    acknowledgement: schemas.AcknowledgementIn,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    # We need to check if the feedback belongs to the current user before acknowledging
    feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not feedback or feedback.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to acknowledge this feedback")

    db_ack = crud.acknowledge_feedback(
        db, 
        feedback_id=feedback_id, 
        employee_id=current_user.id,
        comment=acknowledgement.comment
    )
    if db_ack is None:
        raise HTTPException(status_code=404, detail="Acknowledgement failed")
    return db_ack

# --- Feedback Request Endpoints ---

@app.post("/feedback-requests/", response_model=schemas.FeedbackRequestOut)
def create_feedback_request(
    request: schemas.FeedbackRequestCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    if current_user.role != schemas.RoleEnum.employee:
        raise HTTPException(status_code=403, detail="Only employees can request feedback.")
    if not current_user.manager_id:
        raise HTTPException(status_code=400, detail="You must be assigned to a manager to request feedback.")
    
    return crud.create_feedback_request(
        db=db,
        employee_id=current_user.id,
        manager_id=current_user.manager_id,
        message=request.message
    )

@app.get("/feedback-requests/manager/", response_model=List[schemas.FeedbackRequestOut])
def get_feedback_requests_for_manager(
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    if current_user.role != schemas.RoleEnum.manager:
        raise HTTPException(status_code=403, detail="Only managers can view feedback requests.")
    
    return crud.get_open_feedback_requests(db=db, manager_id=current_user.id)

@app.get("/feedback/{feedback_id}/pdf")
def export_feedback_to_pdf(
    feedback_id: str,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    feedback = crud.get_feedback_details(db, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Security check: only manager or employee involved can download
    if not (current_user.id == feedback.manager_id or current_user.id == feedback.employee_id):
        raise HTTPException(status_code=403, detail="You are not authorized to view this feedback")

    html_content = f"""
    <html>
        <head>
            <title>Feedback Report</title>
            <style>
                body {{ font-family: sans-serif; }}
                h1 {{ color: #333; }}
                .feedback-card {{ border: 1px solid #ccc; padding: 20px; border-radius: 8px; }}
                .label {{ font-weight: bold; }}
            </style>
        </head>
        <body>
            <h1>Feedback Report</h1>
            <div class="feedback-card">
                <p><span class="label">To:</span> {feedback.employee.name}</p>
                <p><span class="label">From:</span> {feedback.manager.name}</p>
                <p><span class="label">Date:</span> {feedback.created_at.strftime('%B %d, %Y')}</p>
                <hr>
                <h3>Strengths:</h3>
                <p>{feedback.strengths}</p>
                <h3>Areas to Improve:</h3>
                <p>{feedback.improvements}</p>
                <p><span class="label">Sentiment:</span> {feedback.sentiment.value}</p>
            </div>
        </body>
    </html>
    """

    pdf_bytes = HTML(string=html_content).write_pdf()
    
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=feedback_{feedback_id}.pdf"
    })

# --- Dashboard Endpoints ---
@app.get("/dashboard/manager/{manager_id}")
def get_manager_dashboard(manager_id: str, db: Session = Depends(get_db), current_user: schemas.UserOut = Depends(auth.get_current_user)):
    if manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to view this dashboard")
    # This is just an example, you might want a more complex dashboard
    feedbacks = crud.get_feedback_for_manager(db, manager_id)
    return {"timeline": feedbacks}

@app.get("/dashboard/employee/{employee_id}")
def employee_dashboard(employee_id: str, db: Session = Depends(get_db), current_user: schemas.UserOut = Depends(auth.get_current_user)):
    if employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to view this dashboard")
    feedbacks = crud.get_feedback_for_employee(db, employee_id)
    return {"timeline": feedbacks}

@app.get("/users/me/", response_model=schemas.UserOut)
def read_users_me(current_user: schemas.UserOut = Depends(auth.get_current_user)):
    return current_user

def get_manager_dashboard_data(
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    if current_user.role != schemas.RoleEnum.manager:
        raise HTTPException(status_code=403, detail="Only managers can access this dashboard")
    
    return crud.get_manager_dashboard_stats(db, manager_id=current_user.id)

@app.get("/tags/", response_model=List[schemas.Tag])
def read_tags(db: Session = Depends(get_db), current_user: schemas.UserOut = Depends(auth.get_current_user)):
    return crud.get_tags(db)

@app.get("/dashboard/manager-stats/")
def get_manager_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(auth.get_current_user)
):
    if current_user.role != schemas.RoleEnum.manager:
        raise HTTPException(status_code=403, detail="Only managers can access this dashboard")
    
    return crud.get_manager_dashboard_stats(db, manager_id=current_user.id)

# --- Static files for frontend ---
dist_path = os.path.join("frontend", "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
