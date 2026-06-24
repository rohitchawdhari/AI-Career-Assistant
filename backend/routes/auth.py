from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
import datetime
import time
import random
from db import db

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


@router.post("/signup")
def signup(user: UserSignup):
    existing_user = users.find_one(
        {"email": user.email}
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    hashed_password = pwd_context.hash(
        user.password
    )

    result = users.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow().isoformat()
    })

    print("================================")
    print("INSERTED ID:", result.inserted_id)
    print("TOTAL USERS:", users.count_documents({}))
    print("================================")

    return {
        "message": "User registered successfully"
    }


@router.post("/login")
def login(user: UserLogin):
    existing_user = users.find_one(
        {"email": user.email}
    )

    print("USER FOUND:", existing_user)

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
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
    expires_at = datetime.datetime.utcnow() + expire_delta

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
    last_login_record = list(login_history.find({"email": user.email}).sort("timestamp", -1).limit(1))
    last_login_time = last_login_record[0]["timestamp"] if last_login_record else int(time.time())

    # Save to MongoDB login history
    login_entry = {
        "email": user.email,
        "timestamp": int(time.time()),
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
    }
    login_history.insert_one(login_entry)

    # Fetch last 5 login history entries for this user
    prior_history = list(login_history.find({"email": user.email}).sort("timestamp", -1).limit(5))
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

    return {
        "access_token": token,
        "token_type": "bearer",
        "name": existing_user["name"],
        "email": existing_user["email"],
        "expires_at": int(expires_at.timestamp()),
        "created_at": created_at,
        "last_login": last_login_time,
        "login_history": history_list
    }


@router.post("/change-password")
def change_password(data: PasswordChangeRequest, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email_from_token = payload.get("email")
    except Exception:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

    if email_from_token != data.email:
        raise HTTPException(status_code=403, detail="Forbidden request")

    existing_user = users.find_one({"email": data.email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password
    if not pwd_context.verify(data.current_password, existing_user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    # Hash and update new password
    hashed_password = pwd_context.hash(data.new_password)
    users.update_one({"email": data.email}, {"$set": {"password": hashed_password}})

    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    existing_user = users.find_one({"email": data.email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Email is not registered")

    # Generate a 6-digit OTP
    otp = str(random.randint(100000, 999999))
    expires_at = int(time.time()) + 300  # Expires in 5 minutes

    # Store OTP in DB
    otp_store.update_one(
        {"email": data.email},
        {"$set": {"otp": otp, "expires_at": expires_at}},
        upsert=True
    )

    # Print to console for server/debug logging
    print("=========================================")
    print(f"PASSWORD RESET OTP FOR {data.email}: {otp}")
    print("=========================================")

    # Return OTP in response (for developer mock/testing purposes)
    return {
        "message": "OTP sent to your email",
        "otp": otp  # Included for ease of testing
    }


@router.post("/verify-otp")
def verify_otp(data: VerifyOTPRequest):
    record = otp_store.find_one({"email": data.email})
    if not record:
        raise HTTPException(status_code=400, detail="No OTP requested for this email")

    if record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    if int(time.time()) > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP has expired")

    existing_user = users.find_one({"email": data.email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash and update password
    hashed_password = pwd_context.hash(data.new_password)
    users.update_one({"email": data.email}, {"$set": {"password": hashed_password}})

    # Remove verified OTP
    otp_store.delete_one({"email": data.email})

    return {"message": "Password has been reset successfully"}