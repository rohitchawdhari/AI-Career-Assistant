from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from dotenv import load_dotenv
import os
import traceback

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
    """Central helper to send emails and output exact failure stack traces for debug/logs."""
    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"EMAIL SENT SUCCESS to {message.recipients}")
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