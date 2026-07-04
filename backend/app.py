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
@app.head("/")
def home():
    return {
        "message": "AI Career Assistant Backend Running"
    }


@app.get("/test-smtp-live")
def test_smtp_live():
    import smtplib
    from email.mime.text import MIMEText
    import os
    import traceback

    username = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    server_host = os.getenv("MAIL_SERVER")
    port_str = os.getenv("MAIL_PORT")
    
    steps = []
    try:
        steps.append(f"Loaded config - Server: {server_host}, Port: {port_str}, Username: {username}")
        if not username or not password or not server_host or not port_str:
            raise ValueError("One or more SMTP environment variables are missing.")

        port = int(port_str)
        steps.append(f"Connecting to SMTP server on port {port}...")
        if port == 465:
            server = smtplib.SMTP_SSL(server_host, port, timeout=10)
        else:
            server = smtplib.SMTP(server_host, port, timeout=10)
        
        steps.append("Sending EHLO...")
        server.ehlo()
        
        if port != 465:
            steps.append("Starting TLS...")
            server.starttls()
            
            steps.append("Sending EHLO after TLS...")
            server.ehlo()
        
        steps.append("Logging in...")
        server.login(username, password)
        
        steps.append("Sending test email to yourself...")
        msg = MIMEText("This is a live diagnostics check of SMTP on Render.")
        msg['Subject'] = 'Render Live SMTP Diagnostics'
        msg['From'] = username
        msg['To'] = username
        server.sendmail(username, [username], msg.as_string())
        
        steps.append("Closing connection...")
        server.quit()
        
        return {
            "status": "success",
            "message": "SMTP Connection and sending succeeded completely!",
            "steps": steps
        }
    except Exception as e:
        tb = traceback.format_exc()
        return {
            "status": "failed",
            "error_type": type(e).__name__,
            "error_message": str(e),
            "traceback": tb,
            "steps": steps
        }