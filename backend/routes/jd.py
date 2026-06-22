from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel

from rag.vector_store import vector_store
from resume.skill_extractor import extract_skills
from resume.jd_matcher import analyze_jd_match

from resume.parser import parse_file
from services.gemini_service import model
import json

router = APIRouter()


class JDRequest(BaseModel):
    job_description: str


class JDAIRequest(BaseModel):
    job_description: str


@router.post("/analyze-jd")
async def analyze_jd(
    request: JDRequest
):
    resume_text = "\n".join(
        vector_store.chunks
    )

    resume_skills = extract_skills(
        resume_text
    )

    result = analyze_jd_match(
        resume_skills,
        request.job_description
    )

    return result


@router.post("/analyze-jd-ai")
async def analyze_jd_ai(
    request: JDAIRequest
):
    if not vector_store.chunks:
        return {"error": "Please upload a resume first."}

    resume_text = "\n".join(vector_store.chunks)
    jd_text = request.job_description

    prompt = f"""
    You are an expert recruiter and career consultant.
    Compare the following candidate resume text with the job description (JD) text.
    Provide a structured JSON response with:
    1. "match_score": A realistic match score from 0 to 100 based on core skills, experience level alignment, and role fit.
    2. "matched_skills": A list of skills present in both the resume and the JD.
    3. "missing_skills": A list of important skills mentioned in the JD but missing or weak in the resume.
    4. "keyword_gaps": A list of specific industry keywords/buzzwords in the JD that are not in the resume.
    5. "suggestions": A list of actionable resume improvements to increase alignment with this specific JD.

    Resume Text:
    \"\"\"{resume_text}\"\"\"

    Job Description:
    \"\"\"{jd_text}\"\"\"

    Your output must be a valid JSON object. Do not wrap it in markdown code blocks like ```json ... ```. Just return the JSON object directly.
    Example format:
    {{
        "match_score": 82,
        "matched_skills": ["Python", "SQL", "Git"],
        "missing_skills": ["AWS", "Docker"],
        "keyword_gaps": ["Cloud Infrastructure", "Containerization"],
        "suggestions": ["Highlight DevOps achievements in your work history", "Mention any AWS projects or certifications you have"]
    }}
    """
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        analysis = json.loads(clean_text)
        return analysis
    except Exception as e:
        print(f"Error in Gemini JD matching: {e}")
        fallback = analyze_jd_match(extract_skills(resume_text), jd_text)
        return {
            "match_score": fallback["match_score"],
            "matched_skills": fallback["matched_skills"],
            "missing_skills": fallback["missing_skills"],
            "keyword_gaps": ["AI comparison failed, falling back to keyword comparison"],
            "suggestions": ["Ensure your technical skill section contains matches from the JD."]
        }


@router.post("/upload-jd")
async def upload_jd(
    file: UploadFile = File(...)
):
    os.makedirs(
        "uploads",
        exist_ok=True
    )

    file_path = os.path.join(
        "uploads",
        file.filename
    )

    with open(
        file_path,
        "wb"
    ) as f:
        f.write(
            await file.read()
        )

    try:
        jd_text = parse_file(file_path)
    except Exception as e:
        return {"error": f"Failed to parse JD file: {str(e)}"}

    if not jd_text.strip():
        return {"error": "Extracted job description text is empty."}

    resume_text = "\n".join(
        vector_store.chunks
    )

    resume_skills = extract_skills(
        resume_text
    )

    result = analyze_jd_match(
        resume_skills,
        jd_text
    )

    result["extracted_text"] = jd_text
    return result