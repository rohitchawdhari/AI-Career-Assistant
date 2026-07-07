from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import time
import datetime
from bson import ObjectId
from jose import jwt
from db import db
from services.gemini_service import model

router = APIRouter()

# MongoDB collections
applications_col = db["job_applications"]
users = db["users"]
resume_reports = db["resume_reports"]
history_collection = db["analysis_history"]
weekly_reports_col = db["weekly_reports"]

SECRET_KEY = "ai-career-assistant-secret-key"
ALGORITHM = "HS256"

# Pydantic models
class JobApplicationSchema(BaseModel):
    company: str
    job_role: str
    job_link: Optional[str] = ""
    location: Optional[str] = ""
    salary: Optional[int] = 0
    application_date: Optional[str] = ""
    interview_date: Optional[str] = ""
    status: str  # Saved, Applied, Interview Scheduled, Assessment, Rejected, Offer Received, Accepted, Rejected by User
    notes: Optional[str] = ""

class UpdateApplicationSchema(BaseModel):
    company: Optional[str] = None
    job_role: Optional[str] = None
    job_link: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[int] = None
    application_date: Optional[str] = None
    interview_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

# Helper to verify token and return user email
def get_user_email(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("email").strip().lower()
    except Exception:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

# --- 1. JOB APPLICATION TRACKER ROUTER ---

@router.get("/job-tracker/applications")
def list_applications(
    search: Optional[str] = "",
    status: Optional[str] = "",
    sort_by: Optional[str] = "application_date",
    authorization: str = Header(None)
):
    email = get_user_email(authorization)
    
    query = {"user_email": email}
    if search:
        query["$or"] = [
            {"company": {"$regex": search, "$options": "i"}},
            {"job_role": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["status"] = status
        
    apps = list(applications_col.find(query))
    formatted_apps = []
    for a in apps:
        formatted_apps.append({
            "id": str(a["_id"]),
            "company": a.get("company"),
            "job_role": a.get("job_role"),
            "job_link": a.get("job_link"),
            "location": a.get("location"),
            "salary": a.get("salary", 0),
            "application_date": a.get("application_date"),
            "interview_date": a.get("interview_date"),
            "status": a.get("status"),
            "notes": a.get("notes")
        })
        
    # Python Sorting
    reverse = True
    if sort_by == "salary":
        formatted_apps.sort(key=lambda x: x.get("salary", 0), reverse=reverse)
    elif sort_by == "company":
        formatted_apps.sort(key=lambda x: x.get("company", "").lower())
    else: # application_date default
        formatted_apps.sort(key=lambda x: x.get("application_date", ""), reverse=reverse)
        
    return {"applications": formatted_apps}

@router.post("/job-tracker/applications")
def add_application(data: JobApplicationSchema, authorization: str = Header(None)):
    email = get_user_email(authorization)
    
    new_app = {
        "user_email": email,
        "company": data.company.strip(),
        "job_role": data.job_role.strip(),
        "job_link": data.job_link.strip(),
        "location": data.location.strip(),
        "salary": data.salary,
        "application_date": data.application_date or datetime.date.today().isoformat(),
        "interview_date": data.interview_date,
        "status": data.status,
        "notes": data.notes.strip(),
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    res = applications_col.insert_one(new_app)
    return {"message": "Job application saved successfully", "id": str(res.inserted_id)}

@router.put("/job-tracker/applications/{app_id}")
def update_application(app_id: str, data: UpdateApplicationSchema, authorization: str = Header(None)):
    email = get_user_email(authorization)
    
    existing = applications_col.find_one({"_id": ObjectId(app_id), "user_email": email})
    if not existing:
        raise HTTPException(status_code=404, detail="Application not found")
        
    update_fields = {}
    for field, val in data.dict(exclude_unset=True).items():
        if val is not None:
            update_fields[field] = val
            
    if update_fields:
        applications_col.update_one({"_id": ObjectId(app_id)}, {"$set": update_fields})
        
    return {"message": "Job application updated successfully"}

@router.delete("/job-tracker/applications/{app_id}")
def delete_application(app_id: str, authorization: str = Header(None)):
    email = get_user_email(authorization)
    
    existing = applications_col.find_one({"_id": ObjectId(app_id), "user_email": email})
    if not existing:
        raise HTTPException(status_code=404, detail="Application not found")
        
    applications_col.delete_one({"_id": ObjectId(app_id)})
    return {"message": "Job application deleted successfully"}

@router.get("/job-tracker/stats")
def get_job_tracker_stats(authorization: str = Header(None)):
    email = get_user_email(authorization)
    
    total = applications_col.count_documents({"user_email": email})
    applied = applications_col.count_documents({"user_email": email, "status": "Applied"})
    interviews = applications_col.count_documents({"user_email": email, "status": "Interview Scheduled"})
    offers = applications_col.count_documents({"user_email": email, "status": "Offer Received"})
    rejections = applications_col.count_documents({"user_email": email, "status": "Rejected"})
    
    return {
        "total": total,
        "applied": applied,
        "interviews": interviews,
        "offers": offers,
        "rejections": rejections
    }

# --- 2. USER ANALYTICS DASHBOARD ROUTER ---

@router.get("/analytics/user-trends")
def get_user_trends(authorization: str = Header(None)):
    email = get_user_email(authorization)
    
    # 1. Resume Score History
    resume_records = list(resume_reports.find({}, {"ats_score": 1, "created_at": 1}).sort("_id", -1).limit(10))
    score_trends = []
    for r in reversed(resume_records):
        score_trends.append({
            "score": r.get("ats_score", 50),
            "date": r.get("created_at", datetime.datetime.utcnow().isoformat())[:10]
        })
        
    # 2. Mock Interview Scores Trend
    interview_records = list(history_collection.find({"type": "interview"}).sort("_id", -1).limit(5))
    interview_trends = []
    for idx, i in enumerate(reversed(interview_records)):
        report_data = i.get("report") or {}
        interview_trends.append({
            "attempt": idx + 1,
            "score": report_data.get("overall_score", 65),
            "role": i.get("job_role", "Software Engineer")
        })

    # 3. Active timeline of tools used
    timeline_records = list(history_collection.find().sort("_id", -1).limit(10))
    timeline = []
    for idx, t in enumerate(timeline_records):
        timeline.append({
            "id": idx,
            "type": t.get("type", "tools"),
            "title": f"Used {t.get('type','tool').capitalize()} tool",
            "date": t.get("timestamp", datetime.datetime.utcnow().isoformat())[:16]
        })

    return {
        "score_trends": score_trends if score_trends else [{"score": 70, "date": "2026-07-01"}],
        "interview_trends": interview_trends if interview_trends else [{"attempt": 1, "score": 75, "role": "Full Stack Dev"}],
        "timeline": timeline
    }

# --- 3. WEEKLY REPORT ROUTER ---

@router.get("/weekly-report")
def get_weekly_reports(authorization: str = Header(None)):
    email = get_user_email(authorization)
    reports = list(weekly_reports_col.find({"user_email": email}).sort("_id", -1))
    formatted = []
    for r in reports:
        formatted.append({
            "id": str(r["_id"]),
            "timestamp": r.get("timestamp"),
            "data": r.get("data")
        })
    return {"reports": formatted}

@router.post("/weekly-report/generate")
def generate_weekly_report(authorization: str = Header(None)):
    email = get_user_email(authorization)
    
    # Collect user activity data
    user_apps = list(applications_col.find({"user_email": email}))
    user_interviews = list(history_collection.find({"type": "interview"}).sort("_id", -1).limit(3))
    
    summary_data = {
        "applications_count": len(user_apps),
        "interviews_completed": len(user_interviews),
        "recent_job_roles": [a.get("job_role") for a in user_apps[:3]]
    }

    prompt = f"""
    Analyze the following career metrics and weekly activity for user '{email}':
    {json.dumps(summary_data, indent=2)}

    Generate a complete, structured Weekly AI Career Report containing:
    1. Resume progress review.
    2. ATS improvement actions.
    3. Job application status analysis.
    4. Recommended Skills to study next (3-4 items).
    5. Recommended Certifications & online courses.
    6. Recommended Project Ideas.
    7. High-level career strategy advice.
    8. Weekly and Monthly goals.

    Return ONLY a valid JSON object matching this structure:
    {{
        "resume_progress": "...",
        "ats_improvement": "...",
        "job_applications_status": "...",
        "recommended_skills": ["Skill A", "Skill B"],
        "recommended_certs": ["Cert A", "Course B"],
        "recommended_projects": ["Project A", "Project B"],
        "career_advice": "...",
        "goals": {{"weekly": "...", "monthly": "..."}}
    }}
    """
    try:
        res = model.generate_content(prompt)
        report_data = json.loads(res.text.strip().replace("```json", "").replace("```", "").strip())
        
        # Save to DB
        new_report = {
            "user_email": email,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "data": report_data
        }
        weekly_reports_col.insert_one(new_report)
        return {"status": "success", "report": report_data}
    except Exception as e:
        print("Weekly report generation error:", e)
        # Return fallback audit report
        fallback = {
            "resume_progress": "Steady baseline. Consider updating project descriptions with metrics.",
            "ats_improvement": "Increase density of containerization and cloud infrastructure keywords.",
            "job_applications_status": f"Tracked {summary_data['applications_count']} job applications this week.",
            "recommended_skills": ["FastAPI", "MongoDB Atlas", "Docker"],
            "recommended_certs": ["AWS Certified Cloud Practitioner", "Docker Deep Dive"],
            "recommended_projects": ["Serverless API integration pipelines", "Multi-container app scaling"],
            "career_advice": "Keep applying and iterate on resume bullet points using the STAR format.",
            "goals": {"weekly": "Complete at least 1 mock interview attempt.", "monthly": "Apply to 15 target positions."}
        }
        return {"status": "success", "report": fallback}
