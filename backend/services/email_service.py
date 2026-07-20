from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from dotenv import load_dotenv
import os
import traceback
import httpx

load_dotenv()

# Determine port and corresponding SSL/TLS flags dynamically
port = int(os.getenv("MAIL_PORT") or 587)
use_ssl = (port == 465)
use_tls = (port != 465)  # STARTTLS for port 587

print("Loading Email connection config...")
print(f"MAIL_USERNAME: {os.getenv('MAIL_USERNAME')}")
print(f"MAIL_SERVER: {os.getenv('MAIL_SERVER')}")
print(f"MAIL_PORT: {port} (use_ssl: {use_ssl}, use_tls: {use_tls})")
print(f"MAIL_FROM: {os.getenv('MAIL_FROM')}")
print(f"MAIL_PASSWORD length: {len(os.getenv('MAIL_PASSWORD') or '')}")
print(f"GMAIL_APP_SCRIPT_URL configured: {bool(os.getenv('GMAIL_APP_SCRIPT_URL'))}")

try:
    conf = ConnectionConfig(
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
        MAIL_FROM=os.getenv("MAIL_FROM"),
        MAIL_PORT=port,
        MAIL_SERVER=os.getenv("MAIL_SERVER"),
        MAIL_STARTTLS=use_tls,
        MAIL_SSL_TLS=use_ssl,
        USE_CREDENTIALS=True
    )
except Exception as e:
    print("CRITICAL: Failed to initialize ConnectionConfig for FastMail!")
    traceback.print_exc()

ADMIN_EMAIL = os.getenv("MAIL_FROM") or os.getenv("MAIL_USERNAME") or "rohitchawdhari48@gmail.com"


async def _send_message_safe(message: MessageSchema):
    """Central helper to send emails. 
    1. Tries Google Apps Script HTTPS relay first (bypasses all blocks & Gmail restrictions).
    2. Tries Brevo/Resend REST APIs if keys exist.
    3. Falls back to direct SMTP.
    """
    
    # 0. Try Google Apps Script URL first (recommended for sending from personal Gmail)
    app_script_url = os.getenv("GMAIL_APP_SCRIPT_URL")
    if app_script_url:
        print("Attempting to send email via Google Apps Script HTTPS Relay...")
        payload = {
            "to": ", ".join(message.recipients),
            "subject": message.subject,
            "body": message.body
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(app_script_url, json=payload, timeout=15)
                if res.status_code == 200:
                    print(f"Google Apps Script Success: Email sent to {message.recipients}")
                    return
                else:
                    print(f"Google Apps Script Failure: status={res.status_code}, response={res.text}")
        except Exception as e:
            print(f"Google Apps Script Exception: {e}")

    # 1. Try Brevo API
    brevo_key = os.getenv("BREVO_API_KEY")
    if brevo_key:
        print("Attempting to send email via Brevo HTTPS API...")
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": brevo_key,
            "Content-Type": "application/json"
        }
        sender_email = os.getenv("MAIL_FROM") or "rohitchawdhari48@gmail.com"
        payload = {
            "sender": {"name": "AI Career Assistant", "email": sender_email},
            "to": [{"email": email} for email in message.recipients],
            "subject": message.subject,
            "textContent": message.body
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, headers=headers, timeout=10)
                if res.status_code in [200, 201, 202]:
                    print(f"Brevo API Success: Email sent to {message.recipients}")
                    return
                else:
                    print(f"Brevo API Failure: status={res.status_code}, response={res.text}")
        except Exception as e:
            print(f"Brevo API Exception: {e}")

    # 2. Try Resend API
    resend_key = os.getenv("RESEND_API_KEY")
    if resend_key:
        print("Attempting to send email via Resend HTTPS API...")
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {resend_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": "AI Career Assistant <onboarding@resend.dev>",
            "to": message.recipients,
            "subject": message.subject,
            "text": message.body
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, headers=headers, timeout=10)
                if res.status_code in [200, 201, 202]:
                    print(f"Resend API Success: Email sent to {message.recipients}")
                    return
                else:
                    print(f"Resend API Failure: status={res.status_code}, response={res.text}")
        except Exception as e:
            print(f"Resend API Exception: {e}")

    # 3. Fallback to SMTP
    print("No REST API keys / Script URL found. Falling back to SMTP connection...")
    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"SMTP Success: Email sent to {message.recipients}")
    except Exception as e:
        print(f"SMTP ERROR: Failed to send email to {message.recipients}. Details: {e}")
        traceback.print_exc()


async def send_welcome_email(
    email: str,
    name: str,
    registration_time: str
):
    message = MessageSchema(
        subject="Welcome to AI Career Assistant 🚀",
        recipients=[email],
        body=f"""
Hello {name},

Welcome to AI Career Assistant.

Your account has been created successfully.

Registration Details:
- Name: {name}
- Email: {email}
- Registration Date & Time: {registration_time}

You can now:
✓ Upload Resume
✓ ATS Analysis
✓ AI Career Guidance
✓ Skill Gap Analysis

Regards,
AI Career Assistant Team
""",
        subtype="plain"
    )
    await _send_message_safe(message)


async def send_admin_registration_alert(
    user_name: str,
    user_email: str,
    registration_time: str
):
    message = MessageSchema(
        subject="New User Registration Alert",
        recipients=[ADMIN_EMAIL],
        body=f"""
Hello Admin,

A new user has registered on AI Career Assistant.

User Details:
- Name: {user_name}
- Email: {user_email}
- Registration Date & Time: {registration_time}

AI Career Assistant
""",
        subtype="plain"
    )
    await _send_message_safe(message)


async def send_login_email(
    email: str,
    name: str,
    login_time: str
):
    message = MessageSchema(
        subject="Login Successful - AI Career Assistant",
        recipients=[email],
        body=f"""
Hello {name},

You have successfully logged in to AI Career Assistant.

Login Details:
- Login Date & Time: {login_time}

Security Warning: If this wasn't you, change your password immediately.

Regards,
AI Career Assistant Team
""",
        subtype="plain"
    )
    await _send_message_safe(message)


async def send_admin_login_alert(
    user_name: str,
    user_email: str,
    login_time: str
):
    message = MessageSchema(
        subject="New User Login Alert",
        recipients=[ADMIN_EMAIL],
        body=f"""
Hello Admin,

A user has logged in to AI Career Assistant.

User Details:
- Name: {user_name}
- Email: {user_email}
- Login Date & Time: {login_time}

AI Career Assistant
""",
        subtype="plain"
    )
    await _send_message_safe(message)


async def send_otp_email(
    email: str,
    otp: str
):
    message = MessageSchema(
        subject="Password Reset Verification OTP - AI Career Assistant 🔑",
        recipients=[email],
        body=f"""
Hello,

You have requested to reset your password on AI Career Assistant.

Your 6-digit Verification Code (OTP) is:
👉 {otp} 👈

This code is valid for 5 minutes. Do not share this OTP with anyone.

If you did not request a password reset, please ignore this email.

Regards,
AI Career Assistant Team
""",
        subtype="plain"
    )
    await _send_message_safe(message)


async def send_logout_email(
    email: str
):
    message = MessageSchema(
        subject="Logout Successful - AI Career Assistant",
        recipients=[email],
        body=f"""
Hello,

You have successfully logged out of AI Career Assistant.

If you did not initiate this logout, please secure your account by logging in and changing your password.

Regards,
AI Career Assistant Team
""",
        subtype="plain"
    )
    await _send_message_safe(message)


async def send_password_changed_email(
    email: str
):
    message = MessageSchema(
        subject="Password Changed Successfully - AI Career Assistant 🔒",
        recipients=[email],
        body=f"""
Hello,

Your password for AI Career Assistant has been changed successfully.

If you did not make this change, please contact support or reset your password immediately using the forgot password option.

Regards,
AI Career Assistant Team
""",
        subtype="plain"
    )
    await _send_message_safe(message)


async def send_account_deleted_email(
    email: str
):
    message = MessageSchema(
        subject="Account Permanently Deleted - AI Career Assistant 🗑️",
        recipients=[email],
        body=f"""
Hello,

Your account associated with {email} has been permanently deleted from AI Career Assistant.

All your profile details, analysis records, and history have been wiped from our system.

If you did not initiate this deletion, please contact support immediately.

Regards,
AI Career Assistant Team
""",
        subtype="plain"
    )
    await _send_message_safe(message)


async def send_candidate_shortlisted_email(
    email: str,
    candidate_name: str,
    job_title: str
):
    message = MessageSchema(
        subject=f"Congratulations! Application Shortlisted for {job_title} 🎉",
        recipients=[email],
        body=f"""
Hello {candidate_name},

Great news! We are pleased to inform you that your application for the position of "{job_title}" has been Shortlisted by our recruitment team after an initial resume screening.

Next Steps:
- Our recruitment coordinator will follow up with interview schedule details.
- You can check your candidate portal dashboard anytime for interview notifications and updates.

Thank you for your interest in joining our team!

Best regards,
Talent Acquisition Team
AI Career Assistant Recruitment Platform
""",
        subtype="plain"
    )
    await _send_message_safe(message)


async def send_candidate_rejected_email(
    email: str,
    candidate_name: str,
    job_title: str
):
    message = MessageSchema(
        subject=f"Application Update: {job_title}",
        recipients=[email],
        body=f"""
Hello {candidate_name},

Thank you for taking the time to apply for the position of "{job_title}".

After careful review of your resume and qualifications, we regret to inform you that we will not be moving forward with your application for this specific role at this time.

We appreciate your effort and invite you to stay connected and apply for future openings that match your skills.

We wish you all the best in your career journey.

Sincerely,
Talent Acquisition Team
AI Career Assistant Recruitment Platform
""",
        subtype="plain"
    )
    await _send_message_safe(message)