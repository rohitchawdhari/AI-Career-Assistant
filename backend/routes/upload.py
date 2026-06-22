from fastapi import APIRouter, UploadFile, File
from resume.parser import parse_file
from resume.skill_extractor import extract_skills
from resume.ats_score import calculate_ats_score
from resume.insights import extract_resume_insights

from rag.pdf_loader import split_text
from rag.embeddings import create_embeddings
from rag.vector_store import vector_store
from services.gemini_service import model

import os
import json

router = APIRouter()



@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    os.makedirs("uploads", exist_ok=True)

    file_path = os.path.join(
        "uploads",
        file.filename
    )

    with open(file_path, "wb") as f:
        f.write(await file.read())

    text = parse_file(file_path)

    # Skills Extraction
    skills = extract_skills(text)

    # ATS Score
    ats_score, missing_skills = calculate_ats_score(skills)

    # Resume Insights
    insights = extract_resume_insights(text, skills)

    # RAG Processing
    chunks = split_text(text)
    embeddings = create_embeddings(chunks)
    vector_store.create_index(embeddings, chunks)

    return {
        "filename": file.filename,
        "file_url": f"/uploads/{file.filename}",
        "ats_score": ats_score,
        "skills_found": skills,
        "missing_skills": missing_skills,
        "projects_count": insights["projects_count"],
        "skills_count": insights["skills_count"],
        "education": insights["education"],
        "certifications_count": insights["certifications_count"],
        "experience": insights["experience"]
    }


@router.post("/analyze-resume-ai")
async def analyze_resume_ai():
    if not vector_store.chunks:
        return {"error": "No resume uploaded yet."}

    resume_text = "\n".join(vector_store.chunks)

    prompt = f"""
    You are an expert ATS (Applicant Tracking System) Analyzer.
    Analyze the following resume text and provide a structured JSON response with:
    1. A realistic ATS score (0 to 100) based on professional formatting, structural clarity, impact metrics, and general clarity.
    2. A list of strengths (2-4 items).
    3. A list of weaknesses (2-4 items).
    4. A list of missing keywords/skills standard for their target domain.
    5. Actionable improvement suggestions (3-5 items).

    Resume Text:
    \"\"\"{resume_text}\"\"\"

    Your output must be a valid JSON object. Do not wrap it in markdown code blocks like ```json ... ```. Just return the JSON object directly.
    Example format:
    {{
        "ats_score": 75,
        "strengths": ["Clear section headers", "Strong work history"],
        "weaknesses": ["Lack of quantifiable metrics in project descriptions", "Vague summary"],
        "missing_keywords": ["Docker", "Kubernetes", "CI/CD"],
        "suggestions": ["Add numbers to describe project outcomes", "Create a dedicated skills section"]
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
        print(f"Error in Gemini ATS analysis: {e}")
        return {
            "ats_score": 50,
            "strengths": ["Text parsed successfully"],
            "weaknesses": ["AI evaluation failed"],
            "missing_keywords": [],
            "suggestions": ["Please try again later. Error: " + str(e)]
        }