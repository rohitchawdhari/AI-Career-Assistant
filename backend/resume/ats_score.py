required_skills = [
    "Python",
    "SQL",
    "React",
    "Git",
    "Docker",
    "AWS",
    "JavaScript",
    "HTML",
    "CSS"
]


def calculate_ats_score(found_skills):
    matched = []

    for skill in required_skills:
        if skill in found_skills:
            matched.append(skill)

    score = int((len(matched) / len(required_skills)) * 100)

    missing_skills = [
        skill for skill in required_skills
        if skill not in found_skills
    ]

    return score, missing_skills