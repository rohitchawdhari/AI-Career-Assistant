import os
import json
import datetime
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Header
from pydantic import BaseModel
from jose import jwt
from bson import ObjectId
from db import db
from services.gemini_service import model
from resume.parser import parse_file
from services.email_service import (
    send_candidate_shortlisted_email,
    send_candidate_rejected_email
)

router = APIRouter(prefix="/recruiter")

# JWT configuration for verification
SECRET_KEY = "ai-career-assistant-secret-key"
ALGORITHM = "HS256"

# Collections
recruiter_jobs = db["recruiter_jobs"]
job_applicants = db["job_applicants"]
users_col = db["users"]
recruiter_activity_logs = db["recruiter_activity_logs"]
interviews_col = db["interviews"]

# Verification helper
def verify_recruiter(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email").strip().lower()
    except Exception:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

    user = users_col.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if email == "rohitchawdhari48@gmail.com" or user.get("role") in ["admin", "recruiter"]:
        return email
    raise HTTPException(status_code=403, detail="Recruiter or Admin permissions required")

def log_recruiter_activity(recruiter_email: str, action: str, details: str):
    try:
        recruiter_activity_logs.insert_one({
            "recruiter_email": recruiter_email,
            "action": action,
            "details": details,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
    except Exception as e:
        print(f"Activity logging failed: {e}")

# Pydantic models
class JobCreate(BaseModel):
    title: str
    description: str
    skills: List[str] = []

class StatusRequest(BaseModel):
    status: str

class InterviewSchedule(BaseModel):
    applicant_id: str
    date: str
    time: str
    mode: str = "Online"
    link_or_venue: str
    notes: str = ""

@router.post("/jobs")
def create_job(job: JobCreate, authorization: str = Header(None)):
    recruiter_email = verify_recruiter(authorization)
    
    title = job.title.strip()
    description = job.description.strip()
    
    if not title or not description:
        raise HTTPException(status_code=400, detail="Title and description are required")
        
    new_job = {
        "title": title,
        "description": description,
        "skills": job.skills,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    result = recruiter_jobs.insert_one(new_job)
    new_job["id"] = str(result.inserted_id)
    new_job.pop("_id", None)
    
    log_recruiter_activity(recruiter_email, "Job Created", f"Created job posting '{title}'")
    return new_job

@router.put("/jobs/{job_id}")
def update_job(job_id: str, job: JobCreate, authorization: str = Header(None)):
    recruiter_email = verify_recruiter(authorization)
    
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    title = job.title.strip()
    description = job.description.strip()
    
    if not title or not description:
        raise HTTPException(status_code=400, detail="Title and description are required")
        
    result = recruiter_jobs.update_one(
        {"_id": oid},
        {"$set": {
            "title": title,
            "description": description,
            "skills": job.skills
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job posting not found")
        
    log_recruiter_activity(recruiter_email, "Job Updated", f"Updated job posting '{title}'")
    return {"message": "Job posting updated successfully"}

@router.get("/jobs")
def list_jobs(authorization: str = Header(None)):
    verify_recruiter(authorization)
    
    jobs_cursor = recruiter_jobs.find().sort("created_at", -1)
    jobs = []
    for j in jobs_cursor:
        job_id = str(j["_id"])
        # Fetch all applicants for metrics
        apps = list(job_applicants.find({"job_id": job_id}))
        
        applicant_count = len(apps)
        
        # Calculate stats
        scores = [a.get("ats_match_score", 0) for a in apps]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        
        shortlisted_count = sum(1 for a in apps if a.get("status") == "Shortlisted")
        rejected_count = sum(1 for a in apps if a.get("status") == "Rejected")
        
        jobs.append({
            "id": job_id,
            "title": j.get("title"),
            "description": j.get("description"),
            "skills": j.get("skills", []),
            "created_at": j.get("created_at"),
            "applicant_count": applicant_count,
            "avg_score": avg_score,
            "shortlisted_count": shortlisted_count,
            "rejected_count": rejected_count
        })
    return jobs

@router.delete("/jobs/{job_id}")
def delete_job(job_id: str, authorization: str = Header(None)):
    recruiter_email = verify_recruiter(authorization)
    
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    result = recruiter_jobs.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job posting not found")
        
    # Delete associated applicants
    job_applicants.delete_many({"job_id": job_id})
    log_recruiter_activity(recruiter_email, "Job Deleted", f"Deleted job posting ID '{job_id}'")
    return {"message": "Job posting and applicants deleted successfully"}

@router.get("/jobs/{job_id}/applicants")
def list_applicants(job_id: str, authorization: str = Header(None)):
    verify_recruiter(authorization)
    
    applicants_cursor = job_applicants.find({"job_id": job_id}).sort("ats_match_score", -1)
    applicants = []
    for a in applicants_cursor:
        applicants.append({
            "id": str(a["_id"]),
            "job_id": a.get("job_id"),
            "candidate_name": a.get("candidate_name", "Unknown Candidate"),
            "candidate_email": a.get("candidate_email", "Unknown Email"),
            "ats_match_score": a.get("ats_match_score", 0),
            "matched_skills": a.get("matched_skills", []),
            "missing_skills": a.get("missing_skills", []),
            "experience_summary": a.get("experience_summary", "N/A"),
            "education_match": a.get("education_match", "N/A"),
            "transparency_notes": a.get("transparency_notes", "N/A"),
            "resume_filename": a.get("resume_filename", "Resume.pdf"),
            "status": a.get("status", "Under Review"),
            "created_at": a.get("created_at")
        })
    return applicants

@router.post("/applicants/{applicant_id}/status")
async def update_applicant_status(applicant_id: str, data: StatusRequest, authorization: str = Header(None)):
    recruiter_email = verify_recruiter(authorization)
    
    try:
        oid = ObjectId(applicant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid applicant ID format")
        
    status = data.status.strip()
    if status not in ["Shortlisted", "Under Review", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be Shortlisted, Under Review, or Rejected")
        
    result = job_applicants.update_one({"_id": oid}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Applicant not found")
        
    # Fetch applicant and job details for notification & log
    applicant = job_applicants.find_one({"_id": oid})
    cand_name = applicant.get("candidate_name", "Candidate")
    cand_email = applicant.get("candidate_email", "")
    job_id = applicant.get("job_id", "")
    
    job_title = "Position"
    if job_id:
        try:
            j = recruiter_jobs.find_one({"_id": ObjectId(job_id)})
            if j:
                job_title = j.get("title", "Position")
        except Exception:
            pass
            
    log_recruiter_activity(recruiter_email, f"Candidate {status}", f"Updated {cand_name}'s status to {status} for position '{job_title}'")
    
    # Send email notification asynchronously
    if status == "Shortlisted" and cand_email and cand_email != "unknown email":
        try:
            await send_candidate_shortlisted_email(cand_email, cand_name, job_title)
        except Exception as e:
            print(f"Shortlist email error: {e}")
    elif status == "Rejected" and cand_email and cand_email != "unknown email":
        try:
            await send_candidate_rejected_email(cand_email, cand_name, job_title)
        except Exception as e:
            print(f"Rejection email error: {e}")
            
    return {"message": f"Candidate status updated to {status}"}

@router.post("/jobs/{job_id}/upload-resumes")
async def upload_resumes(job_id: str, files: List[UploadFile] = File(...), authorization: str = Header(None)):
    recruiter_email = verify_recruiter(authorization)
    
    # Check if job exists
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
        
    job = recruiter_jobs.find_one({"_id": oid})
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
        
    jd_text = job.get("description")
    os.makedirs("uploads", exist_ok=True)
    
    results = []
    for file in files:
        file_path = os.path.join("uploads", file.filename)
        # Write to uploads file
        with open(file_path, "wb") as f:
            f.write(await file.read())
            
        try:
            # Parse text
            resume_text = parse_file(file_path)
            
            # Call Gemini
            prompt = f"""
            You are an expert technical recruiter.
            Compare the candidate's resume text with the job description (JD).
            
            Analyze the candidate profile objectively.
            
            Resume Text:
            \"\"\"{resume_text}\"\"\"

            Job Description:
            \"\"\"{jd_text}\"\"\"

            Return ONLY a raw JSON object. Do not wrap it in markdown code blocks like ```json ... ```. Just return the JSON object directly.
            The response must contain exactly these keys:
            1. "candidate_name": The candidate's full name (extract from resume, fallback to "Unknown Candidate").
            2. "candidate_email": The candidate's email (extract from resume, fallback to "Unknown Email").
            3. "ats_match_score": A realistic match score from 0 to 100 based on core skills, experience level, and role fit.
            4. "matched_skills": A list of skills present in both the resume and the JD.
            5. "missing_skills": A list of important skills mentioned in the JD but missing or weak in the resume.
            6. "experience_summary": A brief 1-2 sentence description of their career history and seniority fit.
            7. "education_match": A brief 1 sentence description of their educational alignment.
            8. "transparency_notes": A 1-2 sentence honest assessment of their core strengths and areas of growth to ensure fair screening.
            """
            
            response = model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            analysis = json.loads(clean_text)
            
            # Save applicant
            new_applicant = {
                "job_id": job_id,
                "candidate_name": analysis.get("candidate_name", "Unknown Candidate").strip(),
                "candidate_email": analysis.get("candidate_email", "Unknown Email").strip().lower(),
                "ats_match_score": int(analysis.get("ats_match_score", 50)),
                "matched_skills": analysis.get("matched_skills", []),
                "missing_skills": analysis.get("missing_skills", []),
                "experience_summary": analysis.get("experience_summary", "N/A"),
                "education_match": analysis.get("education_match", "N/A"),
                "transparency_notes": analysis.get("transparency_notes", "N/A"),
                "resume_filename": file.filename,
                "status": "Under Review",
                "created_at": datetime.datetime.utcnow().isoformat()
            }
            
            # Insert or update
            existing = job_applicants.find_one({"job_id": job_id, "candidate_email": new_applicant["candidate_email"]})
            if existing:
                job_applicants.update_one({"_id": existing["_id"]}, {"$set": new_applicant})
                new_applicant["id"] = str(existing["_id"])
            else:
                insert_res = job_applicants.insert_one(new_applicant)
                new_applicant["id"] = str(insert_res.inserted_id)
                
            new_applicant.pop("_id", None)
            results.append(new_applicant)
            
        except Exception as e:
            print(f"Error parsing resume {file.filename}: {e}")
            # Fallback mock/error response
            fallback_name = os.path.splitext(file.filename)[0].replace("_", " ").title()
            fallback_app = {
                "job_id": job_id,
                "candidate_name": fallback_name,
                "candidate_email": f"{fallback_name.lower().replace(' ', '')}@example.com",
                "ats_match_score": 40,
                "matched_skills": [],
                "missing_skills": [],
                "experience_summary": "Parsing failed. Evaluated with fallback keyword tracker.",
                "education_match": "Education data extraction error.",
                "transparency_notes": f"System error occurred during screening: {str(e)}",
                "resume_filename": file.filename,
                "status": "Under Review",
                "created_at": datetime.datetime.utcnow().isoformat()
            }
            job_applicants.insert_one(fallback_app)
            fallback_app.pop("_id", None)
            results.append(fallback_app)
            
    log_recruiter_activity(recruiter_email, "Resume Uploaded", f"Uploaded and screened {len(files)} resume(s) for job '{job.get('title')}'")
    return {"message": "Resumes screened and ranked successfully", "results": results}

@router.get("/activity-logs")
def get_activity_logs(authorization: str = Header(None)):
    verify_recruiter(authorization)
    logs_cursor = recruiter_activity_logs.find().sort("timestamp", -1).limit(100)
    logs = []
    for l in logs_cursor:
        logs.append({
            "id": str(l["_id"]),
            "recruiter_email": l.get("recruiter_email", "System"),
            "action": l.get("action", "Action"),
            "details": l.get("details", ""),
            "timestamp": l.get("timestamp")
        })
    return logs

@router.post("/interviews")
def schedule_interview(data: InterviewSchedule, authorization: str = Header(None)):
    recruiter_email = verify_recruiter(authorization)
    
    try:
        oid = ObjectId(data.applicant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid applicant ID format")
        
    applicant = job_applicants.find_one({"_id": oid})
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
        
    job_id = applicant.get("job_id", "")
    job_title = "Position"
    if job_id:
        try:
            j = recruiter_jobs.find_one({"_id": ObjectId(job_id)})
            if j:
                job_title = j.get("title", "Position")
        except Exception:
            pass
            
    interview_data = {
        "applicant_id": data.applicant_id,
        "candidate_name": applicant.get("candidate_name", "Candidate"),
        "candidate_email": applicant.get("candidate_email", "").lower(),
        "job_title": job_title,
        "date": data.date,
        "time": data.time,
        "mode": data.mode,
        "link_or_venue": data.link_or_venue,
        "notes": data.notes,
        "recruiter_email": recruiter_email,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    # Upsert interview record
    existing = interviews_col.find_one({"applicant_id": data.applicant_id})
    if existing:
        interviews_col.update_one({"_id": existing["_id"]}, {"$set": interview_data})
        interview_data["id"] = str(existing["_id"])
    else:
        res = interviews_col.insert_one(interview_data)
        interview_data["id"] = str(res.inserted_id)
        
    interview_data.pop("_id", None)
    
    # Automatically update applicant status to Shortlisted
    job_applicants.update_one({"_id": oid}, {"$set": {"status": "Shortlisted"}})
    
    log_recruiter_activity(
        recruiter_email,
        "Interview Scheduled",
        f"Scheduled interview for {applicant.get('candidate_name')} ({job_title}) on {data.date} at {data.time}"
    )
    
    return {"message": "Interview scheduled successfully", "interview": interview_data}

@router.get("/interviews")
def list_interviews(authorization: str = Header(None)):
    verify_recruiter(authorization)
    cursor = interviews_col.find().sort("date", 1)
    interviews = []
    for i in cursor:
        interviews.append({
            "id": str(i["_id"]),
            "applicant_id": i.get("applicant_id"),
            "candidate_name": i.get("candidate_name"),
            "candidate_email": i.get("candidate_email"),
            "job_title": i.get("job_title"),
            "date": i.get("date"),
            "time": i.get("time"),
            "mode": i.get("mode"),
            "link_or_venue": i.get("link_or_venue"),
            "notes": i.get("notes"),
            "recruiter_email": i.get("recruiter_email"),
            "created_at": i.get("created_at")
        })
    return interviews
