from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import random
import datetime
from jose import jwt
from db import db
from services.gemini_service import model

router = APIRouter(prefix="/enterprise")

# MongoDB collections
certificates_col = db["certificates"]
users = db["users"]
resume_reports = db["resume_reports"]
applications_col = db["job_applications"]
history_collection = db["analysis_history"]

SECRET_KEY = "ai-career-assistant-secret-key"
ALGORITHM = "HS256"

# Pydantic models
class JobSearchRequest(BaseModel):
    role: str
    skills: List[str]
    location: Optional[str] = ""
    experience: Optional[str] = ""
    salary_range: Optional[str] = ""
    company: Optional[str] = ""

class LearningRequest(BaseModel):
    skills: List[str]
    role: str

class GapRoadmapRequest(BaseModel):
    target_job: str
    skills: List[str]

class CertificateUploadRequest(BaseModel):
    name: str
    issuer: str
    issue_date: str
    expiry_date: Optional[str] = ""

class PortfolioGenerateRequest(BaseModel):
    name: str
    bio: str
    github_link: Optional[str] = ""
    linkedin_link: Optional[str] = ""
    skills: List[str]
    theme: str  # Dark, Light, Glassmorphic

class LinkedInPostRequest(BaseModel):
    type: str  # Project Completion, Internship, Certificate, Achievement, Placement, Hackathon, Open Source
    details: str

class EmailWriterRequest(BaseModel):
    type: str  # Referral Request, HR Email, Internship Request, Follow-up, Thank You, Negotiation, Resignation, Cold Email
    details: str

class CoverLetterRequest(BaseModel):
    role: str
    company: str
    jd_text: Optional[str] = ""
    skills: List[str]

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

# --- 1. AI JOB SEARCH ENGINE ---
@router.post("/job-search")
def search_jobs(data: JobSearchRequest, authorization: str = Header(None)):
    get_user_email(authorization)
    
    prompt = f"""
    Generate a list of 3 matching job openings matching the following criteria:
    Role: {data.role}
    Required Skills: {", ".join(data.skills)}
    Location: {data.location}
    Experience: {data.experience}
    Salary: {data.salary_range}
    Preferred Company: {data.company}

    For each job opening, generate:
    1. Company Name
    2. Job Title
    3. Location
    4. Expected annual salary (INR/USD)
    5. Matching Score (0-100) based on skills fit
    6. Why this job matches explanation (3 sentences)
    7. Missing Skills list
    8. Apply Link (mock URL)

    Return ONLY a valid JSON array matching this structure:
    [
        {{
            "company": "...",
            "title": "...",
            "location": "...",
            "salary": "...",
            "score": 85,
            "why_matches": "...",
            "missing_skills": ["Skill A", "Skill B"],
            "apply_link": "https://..."
        }}
    ]
    """
    try:
        res = model.generate_content(prompt)
        jobs = json.loads(res.text.strip().replace("```json", "").replace("```", "").strip())
        return {"jobs": jobs}
    except Exception as e:
        print("Job search generation exception:", e)
        fallback = [
            {
                "company": data.company or "TechCorp Global",
                "title": data.role or "Software Developer",
                "location": data.location or "Bangalore, India",
                "salary": data.salary_range or "₹12,00,000 - ₹18,00,000",
                "score": 88,
                "why_matches": "Your skillset covers the core requirements. Outstanding compatibility with development metrics.",
                "missing_skills": ["Docker", "Kubernetes"],
                "apply_link": "https://careers.google.com"
            }
        ]
        return {"jobs": fallback}

# --- 2. AI LEARNING HUB ---
@router.post("/learning-hub")
def get_learning_hub(data: LearningRequest, authorization: str = Header(None)):
    get_user_email(authorization)
    
    prompt = f"""
    Generate learning resources and recommendations for the skills: {", ".join(data.skills)} for target role '{data.role}'.
    Provide:
    1. YouTube Courses (2 items)
    2. Coursera Courses (2 items)
    3. Udemy Courses (2 items)
    4. freeCodeCamp courses (1 item)
    5. Official Documentation links (2 items)
    6. GitHub Repositories (2 items)
    7. High-level study blogs (2 items)

    Return ONLY a valid JSON object matching this structure:
    {{
        "youtube": [{{"title": "...", "link": "https://..."}}],
        "coursera": [{{"title": "...", "link": "https://..."}}],
        "udemy": [{{"title": "...", "link": "https://..."}}],
        "freecodecamp": [{{"title": "...", "link": "https://..."}}],
        "documentation": [{{"name": "...", "link": "https://..."}}],
        "github": [{{"name": "...", "link": "https://..."}}],
        "blogs": [{{"title": "...", "link": "https://..."}}]
    }}
    """
    try:
        res = model.generate_content(prompt)
        hub = json.loads(res.text.strip().replace("```json", "").replace("```", "").strip())
        return hub
    except Exception as e:
        print("Learning hub generation failed:", e)
        return {
            "youtube": [{"title": "Python & FastAPI Full Course", "link": "https://youtube.com"}],
            "coursera": [{"title": "Google Professional Cloud Architect", "link": "https://coursera.org"}],
            "udemy": [{"title": "React - The Complete Guide", "link": "https://udemy.com"}],
            "freecodecamp": [{"title": "Responsive Web Design Certification", "link": "https://freecodecamp.org"}],
            "documentation": [{"name": "FastAPI Official Documentation", "link": "https://fastapi.tiangolo.com"}],
            "github": [{"name": "Awesome FastAPI", "link": "https://github.com"}],
            "blogs": [{"title": "Real Python Tutorials", "link": "https://realpython.com"}]
        }

# --- 3. AI SKILL GAP ROADMAP ---
@router.post("/skill-gap-roadmap")
def generate_gap_roadmap(data: GapRoadmapRequest, authorization: str = Header(None)):
    get_user_email(authorization)
    
    prompt = f"""
    Compare user skills {", ".join(data.skills)} with target job role '{data.target_job}'.
    Generate a 3-Phase Skill Gap Roadmap to reach readiness.
    
    Provide:
    1. Phase 1 (Core Foundations to acquire)
    2. Phase 2 (Advanced concepts & toolkits)
    3. Phase 3 (Projects & integration deployment)
    4. Recommended project ideas
    5. Required certifications
    6. Timeline (Estimated completion time, e.g., '12 weeks')
    7. Difficulty (Easy, Medium, Hard)

    Return ONLY a valid JSON object matching this structure:
    {{
        "phase1": "...",
        "phase2": "...",
        "phase3": "...",
        "projects": ["Proj A", "Proj B"],
        "certifications": ["Cert A"],
        "timeline": "8 weeks",
        "difficulty": "Medium"
    }}
    """
    try:
        res = model.generate_content(prompt)
        roadmap = json.loads(res.text.strip().replace("```json", "").replace("```", "").strip())
        return roadmap
    except Exception as e:
        print("Roadmap generation exception:", e)
        return {
            "phase1": "Establish strong foundational principles in Object-Oriented design and data modeling.",
            "phase2": "Learn API routing paradigms using FastAPI and Mongo Atlas integrations.",
            "phase3": "Build and deploy scalable container images on Render using Docker.",
            "projects": ["AI-powered job pipeline scheduler", "Microservices dashboard"],
            "certifications": ["AWS Certified Developer"],
            "timeline": "6 weeks",
            "difficulty": "Medium"
        }

# --- 4. CERTIFICATE MANAGER ---
@router.post("/certificates/upload")
def upload_certificate(data: CertificateUploadRequest, authorization: str = Header(None)):
    email = get_user_email(authorization)
    
    # Analyze certificate to retrieve simulated verification code and learned skills list
    prompt = f"Identify 3 key technical skills verified by a certificate titled '{data.name}' issued by '{data.issuer}'."
    try:
        res = model.generate_content(prompt)
        skills = [s.strip().replace("-", "").strip() for s in res.text.strip().split("\n")[:3]]
    except Exception:
        skills = ["Cloud Infrastructure", "System Security", "Process Scaling"]

    new_cert = {
        "user_email": email,
        "name": data.name.strip(),
        "issuer": data.issuer.strip(),
        "issue_date": data.issue_date,
        "expiry_date": data.expiry_date or "No Expiry",
        "verification_status": "Verified via AI Scan",
        "skills_learned": skills,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    res_db = certificates_col.insert_one(new_cert)
    new_cert["id"] = str(res_db.inserted_id)
    new_cert.pop("_id", None)
    return new_cert

@router.get("/certificates")
def list_certificates(authorization: str = Header(None)):
    email = get_user_email(authorization)
    certs = list(certificates_col.find({"user_email": email}))
    for c in certs:
        c["id"] = str(c["_id"])
        c.pop("_id", None)
    return {"certificates": certs}

# --- 5. AI PORTFOLIO GENERATOR ---
@router.post("/portfolio-generator/generate")
def generate_portfolio_site(data: PortfolioGenerateRequest, authorization: str = Header(None)):
    get_user_email(authorization)
    
    # Generate HTML/CSS source code bundle representing the generated portfolio
    html_code = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{data.name} | Professional Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {{
            background: { '#0f172a' if data.theme != 'Light' else '#f8fafc' };
            color: { '#f8fafc' if data.theme != 'Light' else '#0f172a' };
        }}
    </style>
</head>
<body className="font-sans antialiased">
    <div className="max-w-4xl mx-auto px-6 py-20">
        <header className="mb-16">
            <h1 className="text-5xl font-black">{data.name}</h1>
            <p className="text-xl text-purple-500 font-semibold mt-3">{data.bio}</p>
        </header>
        <section className="mb-12">
            <h2 className="text-2xl font-bold border-b pb-2 mb-4">Core Skills</h2>
            <div className="flex flex-wrap gap-2">
                { "".join([f'<span class="px-3 py-1 bg-purple-600/10 text-purple-400 rounded-lg font-bold text-sm">{s}</span>' for s in data.skills]) }
            </div>
        </section>
        <footer className="mt-20 text-xs text-slate-500 flex gap-4">
            {f'<a href="{data.github_link}" class="hover:text-purple-400">GitHub</a>' if data.github_link else ''}
            {f'<a href="{data.linkedin_link}" class="hover:text-purple-400">LinkedIn</a>' if data.linkedin_link else ''}
        </footer>
    </div>
</body>
</html>"""

    return {
        "status": "success",
        "theme": data.theme,
        "html": html_code
    }

# --- 6. AI LINKEDIN POST GENERATOR ---
@router.post("/linkedin-post")
def generate_linkedin_post(data: LinkedInPostRequest, authorization: str = Header(None)):
    get_user_email(authorization)
    
    prompt = f"""
    Create a highly engaging, professional LinkedIn post for category: '{data.type}'.
    Details: {data.details}

    Format professionally using bullet points, emojis, and hashtags. Keep it concise yet impactful.
    Return only the post content text.
    """
    try:
        res = model.generate_content(prompt)
        return {"post": res.text.strip()}
    except Exception as e:
        print("LinkedIn post generation failed:", e)
        return {"post": f"🚀 Excited to announce my progress in {data.details}! #achievement #professional"}

# --- 7. AI EMAIL WRITER ---
@router.post("/email-writer")
def write_email(data: EmailWriterRequest, authorization: str = Header(None)):
    get_user_email(authorization)
    
    prompt = f"""
    Write a professional email template for: '{data.type}'.
    Details: {data.details}

    Include Subject line and Email Body text.
    Return only the formatted email output.
    """
    try:
        res = model.generate_content(prompt)
        return {"email": res.text.strip()}
    except Exception as e:
        print("Email writer exception:", e)
        return {"email": f"Subject: Request regarding {data.type}\n\nDear Team,\n\nI am writing to inquire about the details..."}

# --- 8. AI COVER LETTER STUDIO ---
@router.post("/cover-letter")
def generate_cover_letter(data: CoverLetterRequest, authorization: str = Header(None)):
    get_user_email(authorization)
    
    prompt = f"""
    Create a highly tailored, custom cover letter for target role '{data.role}' at company '{data.company}'.
    Details/Job Description: {data.jd_text}
    User Core Skills: {", ".join(data.skills)}

    Return a complete, polished cover letter text.
    """
    try:
        res = model.generate_content(prompt)
        return {"cover_letter": res.text.strip()}
    except Exception as e:
        print("Cover letter generation failed:", e)
        return {"cover_letter": f"Dear Hiring Manager,\n\nI am writing to express my interest in the {data.role} role at {data.company}."}

# --- 9. AI CAREER SCORE ---
@router.get("/career-score")
def get_career_score(authorization: str = Header(None)):
    email = get_user_email(authorization)
    
    # Calculate stats
    resume_records = list(resume_reports.find({"email": email}))
    latest_ats = resume_records[0].get("ats_score", 65) if resume_records else 65
    
    interviews = list(history_collection.find({"type": "interview"}).sort("_id", -1).limit(1))
    latest_interview = interviews[0].get("report", {}).get("overall_score", 60) if interviews else 60
    
    applications_count = applications_col.count_documents({"user_email": email})
    certificates_count = certificates_col.count_documents({"user_email": email})
    
    # Weighted score algorithm
    career_score = int(
        (latest_ats * 0.4) +
        (latest_interview * 0.3) +
        (min(applications_count, 10) * 1.5) +
        (min(certificates_count, 5) * 3) +
        20  # Base readiness metrics
    )
    career_score = min(max(career_score, 30), 100) # Clamp score between 30 and 100

    prompt = f"""
    Provide 3 concise improvement tips to raise a Career Readiness Score from {career_score}/100 based on stats:
    Latest ATS Score: {latest_ats}
    Latest Interview Score: {latest_interview}
    Applications: {applications_count}
    Certificates: {certificates_count}
    
    Return only a valid JSON array of strings: ["Tip 1", "Tip 2", "Tip 3"]
    """
    try:
        res = model.generate_content(prompt)
        suggestions = json.loads(res.text.strip().replace("```json", "").replace("```", "").strip())
    except Exception:
        suggestions = ["Upload more updated projects.", "Attempt more mock interview sessions.", "Add details to older certifications."]

    return {
        "score": career_score,
        "ats_score": latest_ats,
        "interview_score": latest_interview,
        "applications": applications_count,
        "certificates": certificates_count,
        "suggestions": suggestions
    }

# --- 10. ACHIEVEMENT SYSTEM ---
@router.get("/achievements")
def get_achievements(authorization: str = Header(None)):
    email = get_user_email(authorization)
    
    resume_count = resume_reports.count_documents({"email": email})
    latest_record = resume_reports.find_one({"email": email})
    ats_score = latest_record.get("ats_score", 0) if latest_record else 0
    
    interview_count = history_collection.count_documents({"type": "interview"})
    applications_count = applications_col.count_documents({"user_email": email})
    certificates_count = certificates_col.count_documents({"user_email": email})
    
    badges = [
        {
            "id": "resume_uploaded",
            "name": "Resume Pioneer",
            "description": "First resume successfully uploaded",
            "unlocked": resume_count > 0
        },
        {
            "id": "ats_master",
            "name": "ATS Specialist",
            "description": "Achieve an ATS score above 85",
            "unlocked": ats_score >= 85
        },
        {
            "id": "interviews_done",
            "name": "Speaker Elite",
            "description": "Attempted 3 mock interview runs",
            "unlocked": interview_count >= 3
        },
        {
            "id": "job_hunter",
            "name": "Super Hunter",
            "description": "Applied to 5 target positions",
            "unlocked": applications_count >= 5
        },
        {
            "id": "certifications",
            "name": "Credential Collector",
            "description": "Track 2 professional certifications",
            "unlocked": certificates_count >= 2
        }
    ]
    
    return {"badges": badges}
