from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.gemini_service import model
from rag.vector_store import vector_store
import json

router = APIRouter()


class ImproveRequest(BaseModel):
    target_role: Optional[str] = None


class CoverLetterRequest(BaseModel):
    job_description: str


class InterviewRequest(BaseModel):
    job_description: Optional[str] = None


class RoadmapRequest(BaseModel):
    target_goal: str


@router.post("/improve-resume")
async def improve_resume(request: ImproveRequest):
    if not vector_store.chunks:
        return {"error": "Please upload a resume first."}

    resume_text = vector_store.get_full_text()
    role_clause = f" tailored for a '{request.target_role}' role" if request.target_role else ""

    prompt = f"""
    You are an expert resume writer and career coach.
    Analyze the following resume text and rewrite it to make it highly professional, impact-driven, and ATS-friendly{role_clause}.

    Use the STAR method (Situation, Task, Action, Result) for experiences and focus on quantifiable achievements.

    Resume Text:
    \"\"\"{resume_text}\"\"\"

    Provide the result as a structured JSON object. Do not wrap it in markdown block tags (like ```json ... ```). Output raw JSON.
    The response must contain exactly these keys:
    1. "improved_summary": A professional profile summary (3-4 sentences, impactful).
    2. "improved_experience": A list of bullet points or text block representing rewritten work history with metrics.
    3. "improved_projects": Rewritten project descriptions focusing on technologies, challenges, and results.
    4. "improved_skills": Categorized skills list optimized for ATS systems.
    5. "suggestions": A list of 3-5 specific tips for overall resume optimization.
    6. "markdown_content": A fully formatted, beautifully laid-out Markdown version of the improved resume (utilizing markdown headings, bullet points, lines, etc.).

    Example format:
    {{
        "improved_summary": "...",
        "improved_experience": "...",
        "improved_projects": "...",
        "improved_skills": "...",
        "suggestions": ["...", "..."],
        "markdown_content": "..."
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

        improvement = json.loads(clean_text)
        return improvement
    except Exception as e:
        print(f"Error in improve resume: {e}")
        return {
            "error": f"Failed to rewrite resume: {str(e)}",
            "improved_summary": "AI rewrite failed.",
            "improved_experience": "Please try again later.",
            "improved_projects": "",
            "improved_skills": "",
            "suggestions": [],
            "markdown_content": "# Rewrite Failed\nCould not parse AI response."
        }


@router.post("/generate-cover-letter")
async def generate_cover_letter(request: CoverLetterRequest):
    if not vector_store.chunks:
        return {"error": "Please upload a resume first."}

    resume_text = vector_store.get_full_text()
    jd_text = request.job_description

    prompt = f"""
    You are an expert career consultant.
    Write a tailored, highly professional Cover Letter based on the user's resume text and the target job description.

    Resume Text:
    \"\"\"{resume_text}\"\"\"

    Job Description:
    \"\"\"{jd_text}\"\"\"

    Format the letter professionally. Address the hiring manager, express excitement for the role, connect the candidate's achievements to the requirements in the JD, and close professionally.
    Output only the cover letter content (in plain text or markdown).
    """
    try:
        response = model.generate_content(prompt)
        return {"cover_letter": response.text}
    except Exception as e:
        return {"error": f"Failed to generate cover letter: {str(e)}"}


@router.post("/generate-interview-questions")
async def generate_interview_questions(request: InterviewRequest):
    if not vector_store.chunks:
        return {"error": "Please upload a resume first."}

    resume_text = vector_store.get_full_text()
    jd_clause = f"\nJob Description:\n\"\"\"{request.job_description}\"\"\"" if request.job_description else ""

    prompt = f"""
    You are an expert technical recruiter.
    Analyze the candidate's resume and generate 5 tailored interview questions.
    If a job description is provided below, tailor the questions directly to check the candidate's fit for that role.
    Provide both the questions and sample high-quality answers.

    Candidate Resume:
    \"\"\"{resume_text}\"\"\"{jd_clause}

    Return a structured JSON list of question objects. Do not use markdown backticks around JSON. Just return the JSON object directly.
    Format:
    [
        {{
            "question": "What experience do you have with X technology mentioned in your resume?",
            "answer": "A model answer demonstrating expertise..."
        }},
        ...
    ]
    """
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        questions = json.loads(clean_text)
        return {"questions": questions}
    except Exception as e:
        print(f"Error in interview generator: {e}")
        return {
            "questions": [
                {
                    "question": "Could you walk me through your experience and technical background?",
                    "answer": "Focus on the key achievements, technologies, and projects listed on your resume."
                },
                {
                    "question": "How do you handle challenging problems in a project team setting?",
                    "answer": "Describe a specific challenge, your action, and the positive result."
                }
            ]
        }


@router.post("/generate-roadmap")
async def generate_roadmap(request: RoadmapRequest):
    if not vector_store.chunks:
        return {"error": "Please upload a resume first."}

    resume_text = vector_store.get_full_text()

    prompt = f"""
    You are an expert technical career coach.
    Based on the candidate's current resume profile, create a personalized step-by-step learning and career roadmap to help them transition or progress into their target career goal of: "{request.target_goal}".

    Candidate Current Profile (Resume):
    \"\"\"{resume_text}\"\"\"

    Target Career Goal:
    "{request.target_goal}"

    Structure the roadmap in markdown. Include:
    1. Current skills analysis (what skills are useful vs what gaps exist).
    2. Step-by-step milestones (e.g., Phase 1, Phase 2) with specific topics to study.
    3. Recommended project ideas to build.
    4. Suggested certifications or resources.
    """
    try:
        response = model.generate_content(prompt)
        return {"roadmap": response.text}
    except Exception as e:
        return {"error": f"Failed to generate roadmap: {str(e)}"}
