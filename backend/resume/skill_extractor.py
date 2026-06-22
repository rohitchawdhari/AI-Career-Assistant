skills_db = [
    "Python",
    "Java",
    "C++",
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "MySQL",
    "MongoDB",
    "Machine Learning",
    "Deep Learning",
    "HTML",
    "CSS",
    "Git",
    "Docker",
    "AWS",
    "FastAPI",
    "Tailwind",
    "Data Analytics",
    "Pandas",
    "NumPy"
]

def extract_skills(text):
    found_skills = []

    text_lower = text.lower()

    for skill in skills_db:
        if skill.lower() in text_lower:
            found_skills.append(skill)

    return list(set(found_skills))