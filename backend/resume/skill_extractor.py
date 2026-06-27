import re

skills_db = [
    # Languages
    "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "Ruby", "PHP", "Go", "Rust", 
    "Kotlin", "Swift", "Objective-C", "R", "Scala", "Shell", "Bash", "PowerShell", "Perl", "Haskell",
    # Frontend
    "React", "Angular", "Vue", "Vue.js", "Next.js", "Nuxt.js", "Svelte", "Tailwind", "TailwindCSS", 
    "Bootstrap", "Sass", "LESS", "Webpack", "Vite", "jQuery", "HTML", "CSS", "HTML5", "CSS3",
    # Backend & Frameworks
    "FastAPI", "Flask", "Django", "Node.js", "Express", "Express.js", "Spring Boot", "Spring", 
    "ASP.NET", "Dotnet", "Laravel", "Symfony", "Rails", "Ruby on Rails", "GraphQL", "REST API", 
    "RESTful API", "Microservices", "gRPC", "WebSockets",
    # Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "SQLite", "DynamoDB", 
    "Oracle", "Firebase", "Firestore", "Elasticsearch", "Neo4j", "MariaDB",
    # Cloud & DevOps
    "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud Platform", "Docker", "Kubernetes", 
    "Git", "GitHub", "GitLab", "CI/CD", "Jenkins", "Terraform", "Ansible", "Linux", "Nginx", 
    "Apache", "CircleCI", "TravisCI", "GitHub Actions", "Docker Compose", "Vagrant",
    # Data Science, AI & ML
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "AI", "ML", "NLP", 
    "Natural Language Processing", "Computer Vision", "TensorFlow", "PyTorch", "Keras", 
    "Pandas", "NumPy", "Scikit-learn", "SciPy", "Matplotlib", "Seaborn", "Tableau", "Power BI", 
    "Apache Spark", "Hadoop", "Data Analytics", "Data Engineering", "Data Science", "SQL Server",
    # QA & Testing
    "JUnit", "Selenium", "Cypress", "PyTest", "Jest", "Mocha", "Postman", "QA", "Software Testing", 
    "Unit Testing", "Integration Testing", "TDD", "BDD",
    # Project Management & Methodologies
    "Agile", "Scrum", "Kanban", "Jira", "Confluence", "Trello", "Project Management", 
    "Product Management", "SDLC",
    # Mobile Development
    "Android", "iOS", "Flutter", "React Native", "Xamarin", "SwiftUI",
    # Soft Skills & Competencies
    "Leadership", "Communication", "Teamwork", "Problem Solving", "Critical Thinking", 
    "Time Management", "Collaboration", "Negotiation", "Creativity", "Adaptability",
    # Other Technical Terms
    "JSON", "XML", "YAML", "Security", "Cryptography", "OAuth", "JWT", "OAuth2", "System Design",
    "Design Patterns", "Algorithms", "Data Structures"
]


def extract_skills(text):
    found_skills = []

    text_lower = text.lower()

    for skill in skills_db:
        skill_escaped = re.escape(skill.lower())
        # Use word boundaries for alphabetic-only words like "Go", "Python"
        if skill.isalpha():
            pattern = r'\b' + skill_escaped + r'\b'
        else:
            # Use non-capturing group check for C++, C#, .NET etc.
            pattern = r'(?:^|[\s,.:;])' + skill_escaped + r'(?=[\s,.:;]|$)'
            
        if re.search(pattern, text_lower):
            found_skills.append(skill)

    return list(set(found_skills))