import re

def calculate_ats_score(text: str, found_skills: list):
    text_lower = text.lower()
    
    # 1. Section Presence (Max 10 points)
    # We check if standard sections exist in the text.
    sections = {
        "experience": [r"\bexperience\b", r"\bwork history\b", r"\bemployment\b", r"\bprofessional background\b"],
        "education": [r"\beducation\b", r"\bacademics\b", r"\bacademic qualification\b", r"\beducational background\b"],
        "skills": [r"\bskills\b", r"\btechnical skills\b", r"\bcore competencies\b", r"\btechnologies\b", r"\bexpertise\b"],
        "projects": [r"\bprojects\b", r"\bacademics projects\b", r"\bpersonal projects\b"],
        "summary": [r"\bsummary\b", r"\bprofile\b", r"\bprofessional summary\b", r"\babout me\b", r"\bobjective\b"],
        "certifications": [r"\bcertifications\b", r"\bcertificates\b", r"\bawards\b", r"\bcourses\b"]
    }
    
    section_score = 0
    for section, patterns in sections.items():
        found = False
        for pattern in patterns:
            if re.search(pattern, text_lower):
                found = True
                break
        if found:
            section_score += 2 # Max 12 points, we will cap at 10 points
            
    section_score = min(10, section_score)

    # 2. Contact Information Presence (Max 15 points)
    contact_score = 0
    # Email detection
    has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text_lower))
    if has_email:
        contact_score += 5
        
    # Phone detection
    has_phone = bool(re.search(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", text_lower))
    if has_phone:
        contact_score += 5
        
    # Link detection (LinkedIn, GitHub, Portfolio)
    has_link = bool(re.search(r"linkedin\.com|github\.com|portfolio|linkedin|github", text_lower))
    if has_link:
        contact_score += 5
        
    # 3. Skills Count & Diversity (Max 25 points)
    # Based on number of skills found
    skills_count = len(found_skills)
    if skills_count == 0:
        skills_score = 0
    elif skills_count <= 4:
        skills_score = 8
    elif skills_count <= 8:
        skills_score = 15
    elif skills_count <= 15:
        skills_score = 22
    else:
        skills_score = 25
        
    # 4. Action Verbs Presence (Max 20 points)
    # ATS systems look for action verbs that demonstrate active impact
    action_verbs = [
        "designed", "developed", "implemented", "led", "managed", "optimized", "created", 
        "built", "programmed", "solved", "analyzed", "reduced", "increased", "spearheaded", 
        "streamlined", "coordinated", "achieved", "delivered", "executed", "initiated", 
        "architected", "formulated", "headed", "launched", "transformed", "collaborated"
    ]
    verb_count = sum(text_lower.count(verb) for verb in action_verbs)
    if verb_count == 0:
        verb_score = 0
    elif verb_count <= 3:
        verb_score = 8
    elif verb_count <= 7:
        verb_score = 15
    else:
        verb_score = 20
        
    # 5. Resume Formatting & Length (Max 20 points)
    # Word count evaluation
    words = text_lower.split()
    word_count = len(words)
    
    if word_count == 0:
        length_score = 0
    elif 300 <= word_count <= 1000:
        length_score = 15  # Ideal professional resume length
    elif 100 <= word_count < 300 or 1000 < word_count <= 1500:
        length_score = 10  # Acceptable length
    else:
        length_score = 5   # Too short or excessively verbose
        
    # Keyword Density / Stuffing Check
    # If the same skill keyword appears too many times, it indicates keyword stuffing.
    stuffing_penalty = False
    for skill in found_skills:
        if text_lower.count(skill.lower()) > 8:
            stuffing_penalty = True
            break
    density_score = 10 if not stuffing_penalty else 5
    
    formatting_score = length_score + density_score
    
    # 6. Experience & Timeline detection (Max 10 points)
    experience_score = 0
    if re.search(r"\b\d+\+?\s*years?\b", text_lower):
        experience_score += 5
    if len(re.findall(r"\b(?:19|20)\d{2}\b", text_lower)) >= 2: # Mentions at least 2 calendar years
        experience_score += 5

    # Sum of all components (10 + 15 + 25 + 20 + 20 + 10 = 100 max)
    score = section_score + contact_score + skills_score + verb_score + formatting_score + experience_score
    
    # Clip to 0-100 range
    score = max(0, min(100, score))
    
    # Missing key industry skills to recommend adding
    core_standards = ["Git", "SQL", "Docker", "AWS", "CI/CD", "Agile", "Testing", "Python", "React"]
    missing_skills = [skill for skill in core_standards if skill not in found_skills]
    
    return score, missing_skills