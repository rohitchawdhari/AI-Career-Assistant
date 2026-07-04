from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from dotenv import load_dotenv
import os

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

# Admin email is configured in environment (fallback to MAIL_USERNAME if MAIL_FROM not set)
ADMIN_EMAIL = os.getenv("MAIL_FROM") or os.getenv("MAIL_USERNAME") or "rohitchawdhari48@gmail.com"


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

    fm = FastMail(conf)
    await fm.send_message(message)


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

    fm = FastMail(conf)
    await fm.send_message(message)


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

    fm = FastMail(conf)
    await fm.send_message(message)


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

    fm = FastMail(conf)
    await fm.send_message(message)


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

    fm = FastMail(conf)
    await fm.send_message(message)