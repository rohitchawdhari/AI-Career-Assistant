from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import time
import datetime
from jose import jwt
from db import db
from services.email_service import _send_message_safe, MessageSchema

router = APIRouter(prefix="/admin")

# MongoDB collections
users = db["users"]
login_history = db["login_history"]
resume_reports = db["resume_reports"]
history_collection = db["analysis_history"]

SECRET_KEY = "ai-career-assistant-secret-key"
ALGORITHM = "HS256"

# Pydantic models
class BlockRequest(BaseModel):
    email: str
    block: bool

class AnnouncementRequest(BaseModel):
    subject: str
    body: str

# Helper to verify admin role
def verify_admin(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email").strip().lower()
    except Exception:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

    user = users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if email == "rohitchawdhari48@gmail.com" or user.get("role") == "admin":
        return email
    raise HTTPException(status_code=403, detail="Admin permissions required")

# 1. Dashboard Overview Statistics
@router.get("/stats")
def get_admin_stats(authorization: str = Header(None)):
    verify_admin(authorization)
    
    total_users = users.count_documents({})
    active_users = len(users.distinct("email"))
    
    # New registrations today (since start of current UTC date)
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    new_users_today = users.count_documents({"created_at": {"$gte": today_start}})
    
    # Feature usage counters
    total_uploads = resume_reports.count_documents({})
    ats_count = resume_reports.count_documents({"ats_score": {"$exists": True}})
    
    # Counts from history collection
    jd_count = history_collection.count_documents({"type": "jd"})
    chats_count = history_collection.count_documents({"type": "chat"})
    interviews_count = history_collection.count_documents({"type": "interview"})
    builder_count = history_collection.count_documents({"type": "builder"})
    github_count = history_collection.count_documents({"type": "github"})
    linkedin_count = history_collection.count_documents({"type": "linkedin"})
    portfolio_count = history_collection.count_documents({"type": "portfolio"})
    salary_count = history_collection.count_documents({"type": "salary"})

    return {
        "total_users": total_users,
        "active_users": active_users,
        "new_users_today": new_users_today,
        "total_uploads": total_uploads,
        "ats_analyses": ats_count,
        "jd_analyses": jd_count,
        "ai_chats": chats_count,
        "mock_interviews": interviews_count,
        "resume_builder_usage": builder_count,
        "github_analyses": github_count,
        "linkedin_analyses": linkedin_count,
        "portfolio_analyses": portfolio_count,
        "salary_predictions": salary_count
    }

# 2. Recent Activities feed
@router.get("/recent-activities")
def get_recent_activities(authorization: str = Header(None)):
    verify_admin(authorization)
    
    # Recent users
    recent_users_cursor = users.find({}, {"password": 0}).sort("created_at", -1).limit(5)
    recent_users = []
    for u in recent_users_cursor:
        recent_users.append({
            "name": u.get("name"),
            "email": u.get("email"),
            "created_at": u.get("created_at")
        })
        
    # Recent uploads
    recent_uploads_cursor = resume_reports.find().sort("_id", -1).limit(5)
    recent_uploads = []
    for r in recent_uploads_cursor:
        recent_uploads.append({
            "filename": r.get("filename"),
            "ats_score": r.get("ats_score")
        })
        
    # Recent logins
    recent_logins_cursor = login_history.find().sort("timestamp", -1).limit(5)
    recent_logins = []
    for l in recent_logins_cursor:
        recent_logins.append({
            "email": l.get("email"),
            "timestamp": l.get("timestamp"),
            "ip_address": l.get("ip_address"),
            "user_agent": l.get("user_agent")
        })
        
    return {
        "recent_users": recent_users,
        "recent_uploads": recent_uploads,
        "recent_logins": recent_logins
    }

# 3. User Management Search and List
@router.get("/users")
def list_users(search: Optional[str] = "", authorization: str = Header(None)):
    verify_admin(authorization)
    
    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        }
        
    user_cursor = users.find(query, {"password": 0}).sort("created_at", -1)
    user_list = []
    for u in user_cursor:
        # Fetch summary info
        user_email = u.get("email")
        uploads_count = resume_reports.count_documents({"email": user_email}) # or general
        
        user_list.append({
            "name": u.get("name"),
            "email": user_email,
            "created_at": u.get("created_at"),
            "role": u.get("role", "user"),
            "is_blocked": u.get("is_blocked", False),
            "uploads_count": uploads_count
        })
    return {"users": user_list}

# 4. User Blocking / Unblocking
@router.post("/users/block")
def block_user(data: BlockRequest, authorization: str = Header(None)):
    verify_admin(authorization)
    
    target_email = data.email.strip().lower()
    if target_email == "rohitchawdhari48@gmail.com":
        raise HTTPException(status_code=400, detail="Cannot block the root admin account")
        
    users.update_one({"email": target_email}, {"$set": {"is_blocked": data.block}})
    action = "blocked" if data.block else "unblocked"
    return {"message": f"User {target_email} has been successfully {action}"}

# 5. Delete User account completely
@router.delete("/users/delete")
def delete_user(email: str, authorization: str = Header(None)):
    verify_admin(authorization)
    
    target_email = email.strip().lower()
    if target_email == "rohitchawdhari48@gmail.com":
        raise HTTPException(status_code=400, detail="Cannot delete the root admin account")
        
    users.delete_one({"email": target_email})
    login_history.delete_many({"email": target_email})
    resume_reports.delete_many({"email": target_email})
    history_collection.delete_many({"email": target_email})
    
    return {"message": f"User {target_email} data wiped successfully"}

# 6. Announcement Email dispatch
@router.post("/send-announcement")
async def send_announcement(data: AnnouncementRequest, authorization: str = Header(None)):
    verify_admin(authorization)
    
    # Retrieve all user emails
    user_emails = users.distinct("email")
    if not user_emails:
        return {"message": "No registered users found."}
        
    message = MessageSchema(
        subject=data.subject,
        recipients=user_emails,
        body=data.body,
        subtype="plain"
    )
    try:
        await _send_message_safe(message)
        return {"message": f"Announcement sent to {len(user_emails)} users successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

# 7. System status auditing
@router.get("/system-status")
def get_system_status(authorization: str = Header(None)):
    verify_admin(authorization)
    
    # Audit MongoDB
    try:
        db.command("ping")
        mongo_status = "Online"
    except Exception:
        mongo_status = "Offline"
        
    # Audit Email configuration
    mail_username = os.getenv("MAIL_USERNAME")
    mail_server = os.getenv("MAIL_SERVER")
    email_status = "Configured" if (mail_username and mail_server) else "Unconfigured"
    
    # Audit Gemini API configuration
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_status = "Active" if gemini_key else "Inactive (Fallback Active)"
    
    return {
        "mongodb_status": mongo_status,
        "email_status": email_status,
        "gemini_status": gemini_status,
        "server_status": "Online"
    }
