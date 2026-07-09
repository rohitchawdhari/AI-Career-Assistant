from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from passlib.context import CryptContext
from jose import jwt
import datetime
import requests
import time
import random
from db import db

from services.email_service import (
    send_welcome_email,
    send_admin_registration_alert,
    send_login_email,
    send_admin_login_alert,
    send_otp_email,
    send_logout_email,
    send_password_changed_email,
    send_account_deleted_email
)

router = APIRouter()

users = db["users"]
login_history = db["login_history"]
otp_store = db["otp_store"]  # For storing OTPs temporarily

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

SECRET_KEY = "ai-career-assistant-secret-key"
ALGORITHM = "HS256"


class UserSignup(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class PasswordChangeRequest(BaseModel):
    email: str
    current_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str
    new_password: str


class LogoutRequest(BaseModel):
    email: str


@router.post("/signup")
def signup(user: UserSignup, background_tasks: BackgroundTasks):
    email = user.email.strip().lower()
    existing_user = users.find_one(
        {"email": email}
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    hashed_password = pwd_context.hash(
        user.password
    )

    registration_time = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    result = users.insert_one({
        "name": user.name.strip(),
        "email": email,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow().isoformat()
    })

    print("================================")
    print("INSERTED ID:", result.inserted_id)
    print("TOTAL USERS:", users.count_documents({}))
    print("================================")

    try:
        background_tasks.add_task(send_welcome_email, email, user.name.strip(), registration_time)
        background_tasks.add_task(send_admin_registration_alert, user.name.strip(), email, registration_time)
    except Exception as e:
        print(f"FAILED TO QUEUE SIGNUP EMAILS: {e}")

    return {
        "message": "User registered successfully"
    }


@router.post("/login")
def login(user: UserLogin, background_tasks: BackgroundTasks):
    email = user.email.strip().lower()
    existing_user = users.find_one(
        {"email": email}
    )

    print("USER FOUND:", existing_user)

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if existing_user.get("is_blocked"):
        raise HTTPException(
            status_code=403,
            detail="Your account has been temporarily blocked by the Administrator."
        )

    if "password" not in existing_user:
        raise HTTPException(
            status_code=500,
            detail="Password field missing in database"
        )

    try:
        is_valid = pwd_context.verify(
            user.password,
            existing_user["password"]
        )
    except Exception as e:
        print("VERIFY ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Token expiration in 1 hour
    expire_delta = datetime.timedelta(hours=1)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + expire_delta

    token = jwt.encode(
        {
            "email": existing_user["email"],
            "name": existing_user["name"],
            "exp": expires_at
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    # Log prior last login time before saving this login
    last_login_record = list(login_history.find({"email": email}).sort("timestamp", -1).limit(1))
    last_login_time = last_login_record[0]["timestamp"] if last_login_record else int(time.time())

    # Save to MongoDB login history
    login_entry = {
        "email": email,
        "timestamp": int(time.time()),
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
    }
    login_history.insert_one(login_entry)

    # Fetch last 5 login history entries for this user
    prior_history = list(login_history.find({"email": email}).sort("timestamp", -1).limit(5))
    history_list = []
    for item in prior_history:
        history_list.append({
            "timestamp": item["timestamp"],
            "ip_address": item["ip_address"],
            "user_agent": item["user_agent"]
        })

    # Account creation date
    created_at = existing_user.get("created_at")
    if not created_at:
        created_at = datetime.datetime.utcnow().isoformat()
        # Save creation date in user document if missing
        users.update_one({"_id": existing_user["_id"]}, {"$set": {"created_at": created_at}})

    login_time = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    try:
        background_tasks.add_task(send_login_email, email, existing_user["name"], login_time)
        background_tasks.add_task(send_admin_login_alert, existing_user["name"], email, login_time)
    except Exception as e:
        print(f"FAILED TO QUEUE LOGIN EMAILS: {e}")

    return {
        "access_token": token,
        "token_type": "bearer",
        "name": existing_user["name"],
        "email": existing_user["email"],
        "expires_at": int(expires_at.timestamp()),
        "created_at": created_at,
        "last_login": last_login_time,
        "login_history": history_list,
        "role": existing_user.get("role", "user")
    }


@router.post("/change-password")
def change_password(data: PasswordChangeRequest, background_tasks: BackgroundTasks, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email_from_token = payload.get("email").strip().lower()
    except Exception:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

    email = data.email.strip().lower()
    if email_from_token != email:
        raise HTTPException(status_code=403, detail="Forbidden request")

    existing_user = users.find_one({"email": email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password
    if not pwd_context.verify(data.current_password, existing_user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    # Hash and update new password
    hashed_password = pwd_context.hash(data.new_password)
    users.update_one({"email": email}, {"$set": {"password": hashed_password}})

    try:
        background_tasks.add_task(send_password_changed_email, email)
    except Exception as e:
        print(f"FAILED TO QUEUE PASSWORD CHANGED EMAIL: {e}")

    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    email = data.email.strip().lower()
    existing_user = users.find_one({"email": email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Email is not registered")

    # Generate a 6-digit OTP
    otp = str(random.randint(100000, 999999))
    expires_at = int(time.time()) + 300  # Expires in 5 minutes

    # Store OTP in DB
    otp_store.update_one(
        {"email": email},
        {"$set": {"otp": otp, "expires_at": expires_at}},
        upsert=True
    )

    # Print to console for server/debug logging
    print("=========================================")
    print(f"PASSWORD RESET OTP FOR {email}: {otp}")
    print("=========================================")

    # Send OTP email
    try:
        background_tasks.add_task(send_otp_email, email, otp)
    except Exception as e:
        print(f"FAILED TO QUEUE OTP EMAIL: {e}")

    # Return OTP in response (for developer mock/testing purposes)
    return {
        "message": "OTP sent to your email",
        "otp": otp  # Included for ease of testing
    }


@router.post("/verify-otp")
def verify_otp(data: VerifyOTPRequest, background_tasks: BackgroundTasks):
    email = data.email.strip().lower()
    otp = data.otp.strip()
    record = otp_store.find_one({"email": email})
    if not record:
        raise HTTPException(status_code=400, detail="No OTP requested for this email")

    if record["otp"].strip() != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    if int(time.time()) > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP has expired")

    existing_user = users.find_one({"email": email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash and update password
    hashed_password = pwd_context.hash(data.new_password)
    users.update_one({"email": email}, {"$set": {"password": hashed_password}})

    # Remove verified OTP
    otp_store.delete_one({"email": email})

    try:
        background_tasks.add_task(send_password_changed_email, email)
    except Exception as e:
        print(f"FAILED TO QUEUE PASSWORD CHANGED EMAIL: {e}")

    return {"message": "Password reset successfully"}


@router.post("/logout")
def logout(data: LogoutRequest, background_tasks: BackgroundTasks):
    email = data.email.strip().lower()
    try:
        background_tasks.add_task(send_logout_email, email)
    except Exception as e:
        print(f"FAILED TO QUEUE LOGOUT EMAIL: {e}")

    return {"message": "Logged out successfully"}


@router.delete("/delete-account")
def delete_account(background_tasks: BackgroundTasks, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email").strip().lower()
    except Exception:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

    # Check if user exists
    existing_user = users.find_one({"email": email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete user collections
    users.delete_one({"email": email})
    login_history.delete_many({"email": email})
    otp_store.delete_many({"email": email})

    try:
        background_tasks.add_task(send_account_deleted_email, email)
    except Exception as e:
        print(f"FAILED TO QUEUE DELETION EMAIL: {e}")

    return {"message": "Account permanently deleted"}


class GoogleLoginRequest(BaseModel):
    credential: str

class GoogleSignupRequest(BaseModel):
    credential: str

class GoogleLinkRequest(BaseModel):
    credential: str
    confirm_link: bool

def verify_google_credential(credential: str):
    verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
    response = requests.get(verify_url)
    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Invalid Google credentials or token has expired."
        )
    
    idinfo = response.json()
    email = idinfo.get("email", "").strip().lower()
    name = idinfo.get("name", "").strip()
    google_id = idinfo.get("sub", "")
    picture = idinfo.get("picture", "")
    
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Google ID token does not contain a valid email address."
        )
        
    return {
        "email": email,
        "name": name,
        "google_id": google_id,
        "picture": picture
    }


@router.post("/google-login")
def google_login(data: GoogleLoginRequest, background_tasks: BackgroundTasks):
    g_data = verify_google_credential(data.credential)
    email = g_data["email"]
    
    existing_user = users.find_one({"email": email})
    
    if not existing_user:
        raise HTTPException(
            status_code=400,
            detail="No account found with this Google account. Please Sign Up first."
        )
        
    if existing_user.get("is_blocked"):
        raise HTTPException(
            status_code=403,
            detail="Your account has been temporarily blocked by the Administrator."
        )
        
    # Account linking trigger: If email exists but google_id is not linked
    if not existing_user.get("google_id"):
        return {
            "status": "link_required",
            "email": email,
            "name": g_data["name"],
            "google_id": g_data["google_id"],
            "picture": g_data["picture"]
        }
        
    user_name = existing_user["name"]
    created_at = existing_user.get("created_at") or datetime.datetime.utcnow().isoformat()
    
    expire_delta = datetime.timedelta(hours=1)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + expire_delta
    
    token = jwt.encode(
        {
            "email": email,
            "name": user_name,
            "exp": expires_at
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    login_entry = {
        "email": email,
        "timestamp": int(time.time()),
        "ip_address": "127.0.0.1",
        "user_agent": "Google OAuth Login"
    }
    login_history.insert_one(login_entry)
    
    last_login_record = list(login_history.find({"email": email}).sort("timestamp", -1).skip(1).limit(1))
    last_login_time = last_login_record[0]["timestamp"] if last_login_record else int(time.time())

    prior_history = list(login_history.find({"email": email}).sort("timestamp", -1).limit(5))
    history_list = []
    for item in prior_history:
        history_list.append({
            "timestamp": item["timestamp"],
            "ip_address": item["ip_address"],
            "user_agent": item["user_agent"]
        })

    login_time = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    try:
        background_tasks.add_task(send_login_email, email, user_name, login_time)
        background_tasks.add_task(send_admin_login_alert, user_name, email, login_time)
    except Exception as e:
        print(f"FAILED TO QUEUE GOOGLE LOGIN EMAILS: {e}")

    return {
        "access_token": token,
        "token_type": "bearer",
        "name": user_name,
        "email": email,
        "expires_at": int(expires_at.timestamp()),
        "created_at": created_at,
        "last_login": last_login_time,
        "login_history": history_list,
        "role": existing_user.get("role", "user"),
        "profile_picture": existing_user.get("profile_picture", g_data["picture"])
    }


@router.post("/google-signup")
def google_signup(data: GoogleSignupRequest, background_tasks: BackgroundTasks):
    g_data = verify_google_credential(data.credential)
    email = g_data["email"]
    
    existing_user = users.find_one({"email": email})
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="This account already exists. Please Sign In using Google."
        )
        
    user_name = g_data["name"] if g_data["name"] else email.split("@")[0]
    created_at = datetime.datetime.utcnow().isoformat()
    
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    created_date = now_utc.strftime("%Y-%m-%d")
    created_time = now_utc.strftime("%H:%M:%S")
    
    new_user = {
        "name": user_name,
        "email": email,
        "password": None,
        "google_id": g_data["google_id"],
        "profile_picture": g_data["picture"],
        "provider": "Google",
        "email_verified": True,
        "role": "user",
        "created_at": created_at,
        "created_date": created_date,
        "created_time": created_time
    }
    
    users.insert_one(new_user)
    
    registration_time = now_utc.strftime("%Y-%m-%d %H:%M:%S UTC")
    try:
        background_tasks.add_task(send_welcome_email, email, user_name, registration_time)
        background_tasks.add_task(send_admin_registration_alert, user_name, email, registration_time)
    except Exception as e:
        print(f"FAILED TO QUEUE GOOGLE SIGNUP EMAILS: {e}")
        
    expire_delta = datetime.timedelta(hours=1)
    expires_at = now_utc + expire_delta
    
    token = jwt.encode(
        {
            "email": email,
            "name": user_name,
            "exp": expires_at
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    login_entry = {
        "email": email,
        "timestamp": int(time.time()),
        "ip_address": "127.0.0.1",
        "user_agent": "Google OAuth Signup"
    }
    login_history.insert_one(login_entry)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "name": user_name,
        "email": email,
        "expires_at": int(expires_at.timestamp()),
        "created_at": created_at,
        "last_login": int(time.time()),
        "login_history": [{
            "timestamp": login_entry["timestamp"],
            "ip_address": login_entry["ip_address"],
            "user_agent": login_entry["user_agent"]
        }],
        "role": "user",
        "profile_picture": g_data["picture"]
    }


@router.post("/google-link")
def google_link(data: GoogleLinkRequest, background_tasks: BackgroundTasks):
    g_data = verify_google_credential(data.credential)
    email = g_data["email"]
    
    existing_user = users.find_one({"email": email})
    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User account not found."
        )
        
    if not data.confirm_link:
        raise HTTPException(
            status_code=400,
            detail="Account linking rejected."
        )
        
    users.update_one(
        {"email": email},
        {"$set": {
            "google_id": g_data["google_id"],
            "profile_picture": g_data["picture"],
            "provider": "Email + Google"
        }}
    )
    
    user_name = existing_user["name"]
    created_at = existing_user.get("created_at") or datetime.datetime.utcnow().isoformat()
    
    expire_delta = datetime.timedelta(hours=1)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + expire_delta
    
    token = jwt.encode(
        {
            "email": email,
            "name": user_name,
            "exp": expires_at
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    login_entry = {
        "email": email,
        "timestamp": int(time.time()),
        "ip_address": "127.0.0.1",
        "user_agent": "Google Link Account Login"
    }
    login_history.insert_one(login_entry)
    
    last_login_record = list(login_history.find({"email": email}).sort("timestamp", -1).skip(1).limit(1))
    last_login_time = last_login_record[0]["timestamp"] if last_login_record else int(time.time())

    prior_history = list(login_history.find({"email": email}).sort("timestamp", -1).limit(5))
    history_list = []
    for item in prior_history:
        history_list.append({
            "timestamp": item["timestamp"],
            "ip_address": item["ip_address"],
            "user_agent": item["user_agent"]
        })

    return {
        "access_token": token,
        "token_type": "bearer",
        "name": user_name,
        "email": email,
        "expires_at": int(expires_at.timestamp()),
        "created_at": created_at,
        "last_login": last_login_time,
        "login_history": history_list,
        "role": existing_user.get("role", "user"),
        "profile_picture": g_data["picture"]
    }