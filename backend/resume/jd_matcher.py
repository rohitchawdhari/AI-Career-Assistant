def analyze_jd_match(
    resume_skills,
    job_description
):

    jd_text = job_description.lower()

    matched_skills = []
    missing_skills = []

    for skill in resume_skills:

        if skill.lower() in jd_text:
            matched_skills.append(skill)

    common_skills = [
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

    for skill in common_skills:

        if (
            skill.lower() in jd_text
            and skill not in resume_skills
        ):
            missing_skills.append(skill)

    total = (
        len(matched_skills)
        + len(missing_skills)
    )

    if total == 0:
        match_score = 0
    else:
        match_score = int(
            (
                len(matched_skills)
                / total
            )
            * 100
        )

    return {
        "match_score": match_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills
    }