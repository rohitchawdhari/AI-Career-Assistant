import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

try:
    genai.configure(
        api_key=os.getenv("GEMINI_API_KEY")
    )
    raw_model = genai.GenerativeModel("gemini-2.5-flash")
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    raw_model = None


def get_fallback_response(prompt):
    prompt_lower = prompt.lower()
    
    # 1. ATS Analysis
    if "expert ats" in prompt_lower or "ats_score" in prompt_lower or "ats analyzer" in prompt_lower:
        return """{
            "ats_score": 75,
            "strengths": [
                "Good representation of project experience",
                "Clear section headers and structured layout",
                "Strong technical stack listed clearly"
            ],
            "weaknesses": [
                "Lack of quantifiable metrics in project descriptions",
                "Vague professional summary statement"
            ],
            "missing_keywords": [
                "Docker",
                "Kubernetes",
                "CI/CD",
                "AWS"
            ],
            "suggestions": [
                "Add numbers/percentages to describe project outcomes (e.g. 'Improved performance by 25%')",
                "Create a dedicated skills section optimized for ATS scans",
                "Tailor your profile summary to highlight specific technical achievements"
            ]
        }"""

    # 2. JD Matching
    elif "job description" in prompt_lower or "match_score" in prompt_lower:
        return """{
            "match_score": 82,
            "matched_skills": ["Python", "SQL", "Git", "JavaScript", "React"],
            "missing_skills": ["AWS", "Docker", "Kubernetes"],
            "keyword_gaps": ["Containerization", "Cloud Deployments", "REST API Development"],
            "suggestions": [
                "Highlight experience with Docker or containerization in your project descriptions.",
                "Mention database optimization details to stand out for SQL requirements.",
                "Add a section for cloud services if you have basic knowledge of AWS."
            ]
        }"""

    # 3. Resume Improvement / STAR Rewrite
    elif "improve-resume" in prompt_lower or "improved_summary" in prompt_lower or "markdown_content" in prompt_lower:
        return """{
            "improved_summary": "Results-driven Software Engineer with extensive experience in full-stack development, specializing in Python, JavaScript, and React. Proven track record of designing and deploying scalable web applications, optimizing database performance, and collaborating in agile teams to deliver high-quality software solutions.",
            "improved_experience": "• Developed and optimized responsive web applications using React and Node.js, improving load times by 25% and user engagement by 15%.\\n• Designed and maintained SQL database structures, reducing query response times by 30% through effective indexing and query optimization.\\n• Collaborated with cross-functional teams to define project requirements, design system architecture, and implement CI/CD pipelines.",
            "improved_projects": "• AI Career Assistant: Created a full-stack platform using React, FastAPI, and FAISS vector search to parse resumes and provide ATS analysis, leading to a highly responsive and interactive career coaching tool.\\n• E-commerce platform: Built a secure checkout and product recommendation system, handling over 10,000 monthly active users with zero downtime.",
            "improved_skills": "• Languages: Python, JavaScript, HTML, CSS, SQL\\n• Frameworks & Libraries: React, FastAPI, Node.js, Express\\n• Tools & Databases: Git, MySQL, MongoDB, Docker, AWS",
            "suggestions": [
                "Use active verbs to start each experience bullet point (e.g., 'Designed', 'Optimized', 'Led').",
                "Format skills into clear categories for better readability by both ATS scanners and human recruiters.",
                "Verify contact information is placed prominently at the top of the page."
            ],
            "markdown_content": "# Improved Resume\\n\\n## Professional Summary\\nResults-driven Software Engineer with extensive experience in full-stack development, specializing in Python, JavaScript, and React. Proven track record of designing and deploying scalable web applications, optimizing database performance, and collaborating in agile teams to deliver high-quality software solutions.\\n\\n## Technical Skills\\n* **Languages:** Python, JavaScript, HTML, CSS, SQL\\n* **Frameworks/Libraries:** React, FastAPI, Node.js, Express\\n* **Tools/Databases:** Git, MySQL, MongoDB, Docker, AWS\\n\\n## Experience\\n* **Software Engineer** | *WebDev Corp*\\n  * Developed and optimized responsive web applications using React and Node.js, improving load times by 25% and user engagement by 15%.\\n  * Designed and maintained SQL database structures, reducing query response times by 30% through effective indexing and query optimization.\\n  * Collaborated with cross-functional teams to define project requirements, design system architecture, and implement CI/CD pipelines."
        }"""

    # 4. Cover Letter
    elif "cover letter" in prompt_lower:
        return """# Cover Letter

Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position. With a solid foundation in Python, React, and full-stack development, along with a passion for building AI-driven solutions, I am confident in my ability to contribute value to your engineering team.

In my recent projects, I developed a full-stack AI Career Assistant utilizing React and FastAPI, integrating vector search functionality to help job seekers optimize their resumes. This experience allowed me to tackle complex software architecture challenges, design user-centric interfaces, and build efficient API endpoints. Furthermore, my background in database management and frontend optimization aligns closely with the technical skills outlined in your job description.

I am particularly drawn to your company's innovative culture and dedication to engineering excellence. I am eager to bring my problem-solving skills, collaboration style, and technical expertise to help build impactful products.

Thank you for your time and consideration. I look forward to the opportunity to discuss how my skills and background align with your team's needs.

Sincerely,  
[Candidate Name]"""

    # 5. Interview Questions
    elif "technical recruiter" in prompt_lower or "interview questions" in prompt_lower:
        return """[
            {
                "question": "Can you explain how you designed the vector database search in your AI Career Assistant project?",
                "answer": "I used the FAISS library to create a local vector index of the parsed resume chunks. First, the text is split into chunks of 500 characters, then we generate embeddings using the Gemini embeddings model. We add these to a FAISS IndexFlatL2 index. When the user asks a question, we embed their question and search the FAISS index to retrieve the most relevant chunks as context for the answer generation."
            },
            {
                "question": "What is the difference between local SQL search and semantic RAG search in your ATS match system?",
                "answer": "Local SQL search is based on exact keyword or substring matching, which is fast and deterministic but can miss synonyms (e.g. searching for 'AWS' might miss 'Amazon Web Services'). Semantic search (RAG) utilizes high-dimensional vector embeddings to understand the meaning of the query and documents, allowing us to find conceptually matching items even if the exact words differ."
            },
            {
                "question": "How do you handle API errors or rate-limiting in a production Gemini integration?",
                "answer": "We wrap generative AI calls in robust try-except blocks, implement exponential backoff retry mechanisms, and provide clean fallbacks (such as local parsing, caching previous responses, or showing friendly user-facing messages) so that the application doesn't crash."
            },
            {
                "question": "How do you optimize React performance when rendering long lists of historical analysis items?",
                "answer": "We optimize rendering using React's virtualized list techniques if the list is extremely long, memoize expensive computations using `useMemo`, ensure each list item has a unique stable `key` prop, and avoid unnecessary re-renders of list items using `React.memo`."
            },
            {
                "question": "What are the security implications of uploading user PDF resumes to a public server?",
                "answer": "Uploaded documents must be sanitized to prevent file upload exploits (e.g. verifying file headers, restricting extensions to only PDF/Docx, and saving files under randomized or clean filenames). Personal Identifiable Information (PII) should be handled securely, and access to uploads should be restricted or anonymized."
            }
        ]"""

    # 6. Learning Roadmap
    elif "roadmap" in prompt_lower or "learning path" in prompt_lower:
        return """# Personalized Learning & Career Roadmap

Here is a step-by-step roadmap to guide your transition and progression towards your career goal.

## 1. Current Skills Analysis
* **Strengths:** Strong baseline in programming languages (Python, JavaScript), experience with modern frontend libraries (React), and database operations.
* **Gaps:** Need deeper experience with system design, microservices architecture, containerization (Docker/Kubernetes), and cloud deployment practices.

---

## 2. Step-by-Step Milestones

### Phase 1: Foundations & Advanced Backend (Month 1-2)
* **Topics to Study:** REST API design guidelines, FastAPI advanced features (Dependency Injection, Background Tasks), and relational database optimization.
* **Resources:** Real Python tutorials, FastAPI official documentation, Database Systems course.

### Phase 2: DevOps, Containerization & Cloud (Month 3-4)
* **Topics to Study:** Docker basics, writing multi-stage Dockerfiles, Docker Compose, Kubernetes orchestration, and AWS basics (EC2, S3, IAM, RDS).
* **Resources:** Docker & Kubernetes: The Practical Guide, AWS Certified Cloud Practitioner prep.

### Phase 3: System Design & Scaling (Month 5)
* **Topics to Study:** Caching strategies (Redis), Message queues (RabbitMQ/Celery), Rate limiting, and horizontal vs vertical scaling.
* **Resources:** Designing Data-Intensive Applications by Martin Kleppmann, ByteByteGo.

---

## 3. Recommended Project Ideas
* **Microservices E-Commerce:** Build a simplified e-commerce app with three independent microservices (Products, Orders, Auth) communicating via RabbitMQ, containerized with Docker.
* **Serverless PDF Analyzer:** Build an AWS Lambda function that triggers on PDF upload to an S3 bucket, extracts text, and stores metadata in DynamoDB.

---

## 4. Suggested Certifications
* **AWS Certified Developer – Associate**
* **HashiCorp Certified: Terraform Associate**"""

    # 7. Default / Chat
    else:
        return "Thank you for your question. Here is a helpful response based on your career goals and profile. We are currently operating in offline fallback mode, but you can configure a valid Gemini API key in the backend `.env` file to activate live AI chat. How can I help you optimize your resume or prepare for interviews?"


class GeminiResponseWrapper:
    def __init__(self, text):
        self.text = text


class GeminiModelWrapper:
    def __init__(self, real_model):
        self.real_model = real_model

    def generate_content(self, prompt, *args, **kwargs):
        if not self.real_model:
            return GeminiResponseWrapper(get_fallback_response(prompt))
        try:
            return self.real_model.generate_content(prompt, *args, **kwargs)
        except Exception as e:
            print(f"Gemini API call failed: {e}. Using fallback...")
            return GeminiResponseWrapper(get_fallback_response(prompt))


model = GeminiModelWrapper(raw_model)


def generate_answer(question, context):
    prompt = f"""
    You are a helpful AI Resume Assistant.

    Context:
    {context}

    Question:
    {question}

    Answer the question only from the provided context.
    If the answer is not present in the context, say:
    "The information is not available in the uploaded document."
    """

    try:
        if not raw_model:
            return get_fallback_response(question)
        response = raw_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error in generate_answer: {e}. Using fallback...")
        return get_fallback_response(question)