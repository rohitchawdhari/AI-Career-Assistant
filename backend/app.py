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
async def test_smtp_live():
    import smtplib
    from email.mime.text import MIMEText
    import os
    import traceback
    import httpx

    username = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    server_host = os.getenv("MAIL_SERVER")
    port_str = os.getenv("MAIL_PORT")
    
    brevo_key = os.getenv("BREVO_API_KEY")
    resend_key = os.getenv("RESEND_API_KEY")
    
    steps = []
    
    # 1. Test Brevo if key is defined
    if brevo_key:
        steps.append("Testing Brevo HTTPS REST API...")
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": brevo_key,
            "Content-Type": "application/json"
        }
        sender_email = os.getenv("MAIL_FROM") or "rohitchawdhari48@gmail.com"
        payload = {
            "sender": {"name": "AI Career Test", "email": sender_email},
            "to": [{"email": username or "rohitchawdhari48@gmail.com"}],
            "subject": "Brevo HTTPS REST Test Check",
            "textContent": "This is a Brevo API connection test from Render."
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, headers=headers, timeout=10)
                if res.status_code in [200, 201, 202]:
                    steps.append(f"Brevo Success: status {res.status_code}")
                    return {"status": "success", "message": "Email sent successfully via Brevo HTTPS API!", "steps": steps}
                else:
                    steps.append(f"Brevo Failed: status {res.status_code}, response: {res.text}")
        except Exception as e:
            steps.append(f"Brevo API exception: {e}")

    # 2. Test Resend if key is defined
    if resend_key:
        steps.append("Testing Resend HTTPS REST API...")
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {resend_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": "AI Career Assistant <onboarding@resend.dev>",
            "to": [username or "rohitchawdhari48@gmail.com"],
            "subject": "Resend HTTPS REST Test Check",
            "text": "This is a Resend API connection test from Render."
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, headers=headers, timeout=10)
                if res.status_code in [200, 201, 202]:
                    steps.append(f"Resend Success: status {res.status_code}")
                    return {"status": "success", "message": "Email sent successfully via Resend HTTPS API!", "steps": steps}
                else:
                    steps.append(f"Resend Failed: status {res.status_code}, response: {res.text}")
        except Exception as e:
            steps.append(f"Resend API exception: {e}")

    # 3. Fallback SMTP connection test
    steps.append("No API keys (BREVO_API_KEY/RESEND_API_KEY) found. Testing SMTP connection...")
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