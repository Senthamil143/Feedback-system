#!/usr/bin/env python3
"""
Check timestamps in the database
"""

from database import SessionLocal
import models
from datetime import datetime

def check_timestamps():
    db = SessionLocal()
    
    try:
        print("🔍 Checking Database Timestamps")
        print("=" * 50)
        
        # Check acknowledgements
        print("1. Recent Acknowledgments:")
        acknowledgements = db.query(models.Acknowledgement).order_by(models.Acknowledgement.acknowledged_at.desc()).limit(5).all()
        
        for ack in acknowledgements:
            print(f"   Feedback ID: {ack.feedback_id}")
            print(f"   Employee ID: {ack.employee_id}")
            print(f"   Acknowledged at: {ack.acknowledged_at}")
            print(f"   Raw timestamp: {repr(ack.acknowledged_at)}")
            print()
        
        # Check feedback timestamps
        print("2. Recent Feedback:")
        feedbacks = db.query(models.Feedback).order_by(models.Feedback.created_at.desc()).limit(3).all()
        
        for fb in feedbacks:
            print(f"   Feedback ID: {fb.id}")
            print(f"   Created at: {fb.created_at}")
            print(f"   Updated at: {fb.updated_at}")
            print(f"   Raw created: {repr(fb.created_at)}")
            print(f"   Raw updated: {repr(fb.updated_at)}")
            print()
        
        # Show current time
        print("3. Current Times:")
        print(f"   UTC now: {datetime.utcnow()}")
        print(f"   Local now: {datetime.now()}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_timestamps() 