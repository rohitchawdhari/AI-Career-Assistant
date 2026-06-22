import re


def extract_resume_insights(text, skills):

    projects_count = 0
    certifications_count = 0

    project_keywords = [
        "project",
        "projects"
    ]

    certification_keywords = [
        "certification",
        "certifications",
        "certificate",
        "certificates"
    ]

    text_lower = text.lower()

    for keyword in project_keywords:
        projects_count += text_lower.count(
            keyword
        )

    for keyword in certification_keywords:
        certifications_count += text_lower.count(
            keyword
        )

    education = "Not Found"

    education_patterns = [
        r"b\.?e\.?",
        r"btech",
        r"b\.?tech",
        r"computer science",
        r"engineering",
        r"mca",
        r"bca"
    ]

    for pattern in education_patterns:
        if re.search(
            pattern,
            text_lower
        ):
            education = (
                "Computer Science / Engineering"
            )
            break

    experience = "Fresher"

    experience_match = re.search(
        r"(\d+)\+?\s*years",
        text_lower
    )

    if experience_match:
        experience = (
            experience_match.group(1)
            + " Years"
        )

    return {
        "projects_count": projects_count,
        "skills_count": len(skills),
        "education": education,
        "certifications_count": certifications_count,
        "experience": experience
    }