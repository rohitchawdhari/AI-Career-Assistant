from fastapi import APIRouter, HTTPException, Header
from jose import jwt
from db import db

router = APIRouter(prefix="/candidate")

SECRET_KEY = "ai-career-assistant-secret-key"
ALGORITHM = "HS256"

interviews_col = db["interviews"]
users_col = db["users"]

def get_candidate_email(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("email", "").strip().lower()
    except Exception:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

@router.get("/my-interviews")
def get_my_interviews(authorization: str = Header(None)):
    email = get_candidate_email(authorization)
    if not email:
        return []
        
    cursor = interviews_col.find({"candidate_email": email}).sort("date", 1)
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
            "created_at": i.get("created_at")
        })
    return interviews
