from fastapi import APIRouter, UploadFile, File, HTTPException
from resume.parser import parse_file
from resume.skill_extractor import extract_skills
from resume.ats_score import calculate_ats_score
from resume.insights import extract_resume_insights

from rag.pdf_loader import split_text
from rag.embeddings import create_embeddings
from rag.vector_store import vector_store

from services.gemini_service import model
from db import db

import os
import json
import re

router = APIRouter()

# MongoDB Collection
resume_reports = db["resume_reports"]


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

    # Validation: Ensure text is not empty
    if not text or not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Failed to parse resume text. Please ensure the file is not empty or scanned."
        )

    # Skills Extraction
    skills = extract_skills(text)

    # ATS Score
    ats_score, missing_skills = calculate_ats_score(text, skills)

    # Resume Insights
    insights = extract_resume_insights(text, skills)

    # RAG Processing
    chunks = split_text(text)
    embeddings = create_embeddings(chunks)
    vector_store.create_index(embeddings, chunks, text)

    # Save Report in MongoDB
    resume_reports.insert_one({
        "filename": file.filename,
        "ats_score": ats_score,
        "skills_found": skills,
        "missing_skills": missing_skills,
        "projects_count": insights["projects_count"],
        "skills_count": insights["skills_count"],
        "education": insights["education"],
        "certifications_count": insights["certifications_count"],
        "experience": insights["experience"]
    })

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

    resume_text = vector_store.get_full_text()
    
    # Extract skills and calculate baseline score deterministically
    skills = extract_skills(resume_text)
    calculated_score, missing_skills = calculate_ats_score(resume_text, skills)

    prompt = f"""
    You are an expert ATS (Applicant Tracking System) Analyzer.

    Analyze the following resume text and provide a structured JSON response with:

    1. A realistic ATS score (0 to 100)
    2. A list of strengths (2-4 items)
    3. A list of weaknesses (2-4 items)
    4. A list of missing keywords/skills
    5. Actionable improvement suggestions (3-5 items)

    Resume Text:
    \"\"\"{resume_text}\"\"\"

    Return only valid JSON.
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
        
        # Override/Sync with our advanced python computed score to ensure consistency!
        analysis["ats_score"] = calculated_score
        
        # Make sure missing_keywords has the calculated missing skills as well
        if "missing_keywords" in analysis:
            # Combine Gemini's missing keywords with our deterministic core ones
            combined_missing = list(set(analysis.get("missing_keywords", []) + missing_skills))
            analysis["missing_keywords"] = combined_missing
        else:
            analysis["missing_keywords"] = missing_skills

        return analysis

    except Exception as e:
        print(f"Error in Gemini ATS analysis: {e}")
        
        has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", resume_text))
        
        return {
            "ats_score": calculated_score,
            "strengths": [
                "Technical skills list detected" if skills else "Basic formatting parsed",
                "Contact information present" if has_email else "Resume layout is structured"
            ],
            "weaknesses": [
                "AI analysis tool is running in offline/fallback mode.",
                "Missing key tech skills" if len(missing_skills) > 3 else "Action verbs density can be improved"
            ],
            "missing_keywords": missing_skills,
            "suggestions": [
                "Please configure a valid GEMINI_API_KEY in backend/.env for live AI advice.",
                "Incorporate more industry-standard technical keywords in your skills section.",
                "Quantify your accomplishments using percentages, numbers, or timeframes."
            ]
        }