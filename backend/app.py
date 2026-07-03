from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.upload import router as upload_router
from routes.chat import router as chat_router
from routes.jd import router as jd_router
from routes.assistant import router as assistant_router
from routes.auth import router as auth_router

import os

app = FastAPI()

os.makedirs(
    "uploads",
    exist_ok=True
)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://ai-career-assistant-gray.vercel.app",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes

app.include_router(
    upload_router
)

app.include_router(
    chat_router
)

app.include_router(
    jd_router
)

app.include_router(
    assistant_router
)

app.include_router(
    auth_router
)


@app.get("/")
def home():
    return {
        "message": "AI Career Assistant Backend Running"
    }