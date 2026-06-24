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


async def send_welcome_email(
    email: str,
    name: str
):
    message = MessageSchema(
        subject="Welcome to AI Career Assistant 🚀",
        recipients=[email],
        body=f"""
Hello {name},

Welcome to AI Career Assistant.

Your account has been created successfully.

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


async def send_login_email(
    email: str,
    name: str
):
    message = MessageSchema(
        subject="Login Successful - AI Career Assistant",
        recipients=[email],
        body=f"""
Hello {name},

You have successfully logged in to AI Career Assistant.

If this was not you, please change your password immediately.

Regards,
AI Career Assistant Team
""",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_admin_login_alert(
    admin_email: str,
    user_name: str,
    user_email: str
):
    message = MessageSchema(
        subject="New User Login Alert",
        recipients=[admin_email],
        body=f"""
A user has logged in.

Name: {user_name}
Email: {user_email}

AI Career Assistant
""",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)