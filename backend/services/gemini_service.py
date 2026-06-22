import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel("gemini-2.5-flash")


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

    response = model.generate_content(prompt)

    return response.text