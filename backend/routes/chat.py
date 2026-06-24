from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

from models.question import QuestionRequest

from rag.embeddings import create_embeddings
from rag.vector_store import vector_store

from services.gemini_service import generate_answer, model
import google.generativeai as genai

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # 'user' or 'model'
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


@router.post("/ask")
async def ask_question(data: QuestionRequest):

    query_embedding = create_embeddings(
        [data.question]
    )[0]

    results = vector_store.search(
        query_embedding
    )

    context = "\n".join(results)

    answer = generate_answer(
        data.question,
        context
    )

    return {
        "question": data.question,
        "answer": answer
    }


@router.post("/chat")
async def chat_with_history(data: ChatRequest):
    if not data.messages:
        return {"answer": "How can I help you today?"}

    system_instruction = (
        "You are an expert, professional AI Career Assistant. Help the user with career guidance, "
        "resume advice, interview preparation, skill recommendations, and job search help. "
        "Be friendly, detailed, and format your response in clear markdown (using bullet points, "
        "bold text, headers, and codeblocks where appropriate)."
    )

    if vector_store.chunks:
        resume_text = "\n".join(vector_store.chunks)
        system_instruction += (
            f"\n\nThe user has uploaded a resume. Use this resume text to customize and "
            f"personalize your career advice, answers, and mock interviews:\n{resume_text}"
        )

    # Reconstruct history for Gemini
    formatted_history = []
    # Gemini requires alternate user/model turns. We'll map them appropriately.
    # The last message is the new user prompt.
    latest_msg = data.messages[-1]
    
    for msg in data.messages[:-1]:
        role = "user" if msg.role == "user" else "model"
        formatted_history.append({
            "role": role,
            "parts": [msg.content]
        })

    try:
        # Re-initialize the model configuration with system instructions
        chat_model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        chat = chat_model.start_chat(history=formatted_history)
        response = chat.send_message(latest_msg.content)
        return {"answer": response.text}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        # Fallback to standard chat without history constraints or instructions
        try:
            chat_model = genai.GenerativeModel("gemini-2.5-flash")
            chat = chat_model.start_chat(history=formatted_history)
            response = chat.send_message(latest_msg.content)
            return {"answer": response.text}
        except Exception as ex:
            print(f"Chat failed completely: {ex}. Using fallback.")
            from services.gemini_service import get_fallback_response
            return {"answer": get_fallback_response(latest_msg.content)}