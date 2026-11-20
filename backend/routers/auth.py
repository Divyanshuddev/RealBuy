import time
import uuid
import os
import random
import re
from typing import Optional
from fastapi import APIRouter, Request, Response, HTTPException, status
from pydantic import BaseModel
from backend.database import get_connection, dict_from_row
from backend.auth_utils import (
    hash_password,
    verify_password,
    sign_token,
    get_current_user_from_request,
    COOKIE_NAME,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

def ensure_auth_codes_table():
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS auth_codes (
                id TEXT PRIMARY KEY,
                target TEXT NOT NULL,
                code TEXT NOT NULL,
                purpose TEXT NOT NULL,
                expires_at REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    finally:
        conn.close()

# Auto ensure on load
ensure_auth_codes_table()

def generate_and_store_code(target: str, purpose: str, expiry_seconds: int = 900) -> str:
    clean_target = target.strip().lower()
    code = f"{random.randint(100000, 999999)}"
    expires_at = time.time() + expiry_seconds
    record_id = f"ac_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    
    conn = get_connection()
    try:
        # Clear existing code for same target and purpose
        conn.execute("DELETE FROM auth_codes WHERE LOWER(target) = ? AND purpose = ?", (clean_target, purpose))
        conn.execute(
            "INSERT INTO auth_codes (id, target, code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)",
            (record_id, clean_target, code, purpose, expires_at)
        )
        conn.commit()
    finally:
        conn.close()
    return code

def verify_code_match(target: str, purpose: str, code: str) -> bool:
    clean_target = target.strip().lower()
    clean_code = code.strip()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, expires_at FROM auth_codes WHERE LOWER(target) = ? AND purpose = ? AND code = ? ORDER BY expires_at DESC LIMIT 1",
            (clean_target, purpose, clean_code)
        )
        row = cursor.fetchone()
        if not row:
            return False
        
        # Check expiration
        if time.time() > row["expires_at"]:
            return False
            
        # Delete consumed code
        conn.execute("DELETE FROM auth_codes WHERE id = ?", (row["id"],))
        conn.commit()
        return True
    finally:
        conn.close()

def mask_email(email: str) -> str:
    try:
        user_part, domain_part = email.split("@", 1)
        if len(user_part) <= 2:
            masked_user = user_part[0] + "***"
        else:
            masked_user = user_part[:2] + "***" + user_part[-1]
        return f"{masked_user}@{domain_part}"
    except Exception:
        return email

def apply_auth_cookie(response: Response, token: str, request: Request):
    is_https = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https" or os.getenv("ENVIRONMENT") == "production"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=30 * 24 * 3600,
        path="/",
        httponly=True,
        samesite="lax",
        secure=is_https,
    )

class RegisterRequest(BaseModel):
    name: str
    username: str
    email: str
    password: str
    is_email_verified: Optional[bool] = False
    verification_code: Optional[str] = None

class LoginRequest(BaseModel):
    emailOrUsername: str
    password: str

class SwitchDemoRequest(BaseModel):
    username: str

class CheckEmailRequest(BaseModel):
    email: str

class SendVerificationCodeRequest(BaseModel):
    email: str
    check_available: Optional[bool] = True

class VerifyEmailCodeRequest(BaseModel):
    email: str
    code: str

class ForgotPasswordRequest(BaseModel):
    emailOrUsername: str

class ResetPasswordRequest(BaseModel):
    emailOrUsername: str
    code: str
    newPassword: str

@router.get("/me")
def get_me(request: Request):
    user = get_current_user_from_request(request)
    return {"user": user}

@router.post("/register")
def register(body: RegisterRequest, response: Response, request: Request):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        clean_user = body.username.strip().lower().replace(" ", "_")
        clean_email = body.email.strip().lower()

        if len(clean_user) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be at least 3 characters long."
            )

        if len(body.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long."
            )

        # Check if username is taken
        cursor.execute("SELECT id FROM users WHERE LOWER(username) = ?", (clean_user,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '@{body.username.strip()}' is already taken. Please choose another username."
            )

        # Check if email is already registered
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (clean_email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{body.email.strip()}' already exists. Please sign in instead."
            )

        user_id = f"u_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        pw_hash = hash_password(body.password)

        # Check if email was verified via OTP
        is_verified_flag = 0
        if body.is_email_verified:
            is_verified_flag = 1
        elif body.verification_code:
            if verify_code_match(clean_email, "email_verification", body.verification_code):
                is_verified_flag = 1

        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, name, bio, avatar_url, is_verified, is_admin, role)
            VALUES (?, ?, ?, ?, ?, '', '', ?, 0, 'user')
        """, (user_id, clean_user, clean_email, pw_hash, body.name.strip(), is_verified_flag))
        conn.commit()

        token = sign_token({"id": user_id, "username": body.username.strip().lower(), "role": "user"})

        safe_user = {
            "id": user_id,
            "username": body.username.strip().lower(),
            "email": body.email.strip().lower(),
            "name": body.name.strip(),
            "bio": "",
            "avatar_url": "",
            "is_verified": bool(is_verified_flag),
            "is_admin": False,
            "role": "user"
        }

        apply_auth_cookie(response, token, request)

        return {"user": safe_user, "token": token, "message": "Registered successfully"}
    finally:
        conn.close()

@router.post("/login")
def login(body: LoginRequest, response: Response, request: Request):
    clean_input = body.emailOrUsername.strip().lower()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, username, email, password_hash, name, bio, avatar_url, is_verified, is_admin, role
            FROM users
            WHERE LOWER(email) = ? OR LOWER(username) = ?
        """, (clean_input, clean_input))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password."
            )

        user = dict_from_row(row)
        if not verify_password(body.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password."
            )

        token = sign_token({"id": user["id"], "username": user["username"], "role": user["role"]})

        safe_user = {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "name": user["name"],
            "bio": user["bio"],
            "avatar_url": user["avatar_url"],
            "is_verified": bool(user["is_verified"]),
            "is_admin": bool(user["is_admin"]),
            "role": user["role"],
        }

        apply_auth_cookie(response, token, request)

        return {"user": safe_user, "token": token, "message": "Logged in successfully."}
    finally:
        conn.close()

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"message": "Logged out successfully"}

@router.post("/switch-demo")
def switch_demo(body: SwitchDemoRequest, response: Response, request: Request):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, username, email, name, bio, avatar_url, is_verified, is_admin, role
            FROM users
            WHERE LOWER(username) = ?
        """, (body.username.strip().lower(),))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Demo user {body.username} not found")

        user = dict_from_row(row)
        token = sign_token({"id": user["id"], "username": user["username"], "role": user["role"]})

        safe_user = {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "name": user["name"],
            "bio": user["bio"],
            "avatar_url": user["avatar_url"],
            "is_verified": bool(user["is_verified"]),
            "is_admin": bool(user["is_admin"]),
            "role": user["role"],
        }

        apply_auth_cookie(response, token, request)

        return {"user": safe_user, "token": token, "message": f"Switched to persona @{user['username']}"}
    finally:
        conn.close()

@router.post("/check-email")
def check_email(body: CheckEmailRequest):
    clean_email = body.email.strip().lower()
    if not clean_email or "@" not in clean_email or "." not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (clean_email,))
        row = cursor.fetchone()
        if row:
            return {
                "available": False,
                "email": clean_email,
                "message": f"Account with '{clean_email}' already exists. Please sign in."
            }
        return {
            "available": True,
            "email": clean_email,
            "message": f"'{clean_email}' is available."
        }
    finally:
        conn.close()

@router.post("/send-verification-code")
def send_verification_code(body: SendVerificationCodeRequest):
    clean_email = body.email.strip().lower()
    if not clean_email or "@" not in clean_email or "." not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    if body.check_available:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (clean_email,))
            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail=f"An account with email '{clean_email}' already exists. Please sign in instead."
                )
        finally:
            conn.close()

    code = generate_and_store_code(clean_email, "email_verification", expiry_seconds=900)
    return {
        "success": True,
        "email": clean_email,
        "code": code,
        "expires_in": 900,
        "message": f"Verification code sent to {clean_email}."
    }

@router.post("/verify-email-code")
def verify_email_code(body: VerifyEmailCodeRequest):
    clean_email = body.email.strip().lower()
    clean_code = body.code.strip()

    if not clean_code or len(clean_code) < 4:
        raise HTTPException(status_code=400, detail="Please provide a valid verification code.")

    matched = verify_code_match(clean_email, "email_verification", clean_code)
    if not matched:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification code. Please check your code or request a new one."
        )

    # If user already registered, update is_verified flag
    conn = get_connection()
    try:
        conn.execute("UPDATE users SET is_verified = 1 WHERE LOWER(email) = ?", (clean_email,))
        conn.commit()
    finally:
        conn.close()

    return {
        "success": True,
        "verified": True,
        "email": clean_email,
        "message": "Email verified successfully!"
    }

@router.post("/forgot-password/request")
def forgot_password_request(body: ForgotPasswordRequest):
    clean_input = body.emailOrUsername.strip().lower()
    if not clean_input:
        raise HTTPException(status_code=400, detail="Please enter your email or username.")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, username, email
            FROM users
            WHERE LOWER(email) = ? OR LOWER(username) = ?
        """, (clean_input, clean_input))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=404,
                detail=f"No account found matching '{body.emailOrUsername.strip()}'. Please check your spelling or create an account."
            )

        user = dict_from_row(row)
        code = generate_and_store_code(user["email"], "password_reset", expiry_seconds=900)
        masked = mask_email(user["email"])

        return {
            "success": True,
            "username": user["username"],
            "masked_email": masked,
            "code": code,
            "message": f"Password reset code generated for {masked}."
        }
    finally:
        conn.close()

@router.post("/forgot-password/reset")
def forgot_password_reset(body: ResetPasswordRequest):
    clean_input = body.emailOrUsername.strip().lower()
    clean_code = body.code.strip()
    new_pw = body.newPassword

    if not clean_input:
        raise HTTPException(status_code=400, detail="Username or email is required.")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
    if not clean_code:
        raise HTTPException(status_code=400, detail="Security reset code is required.")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, username, email
            FROM users
            WHERE LOWER(email) = ? OR LOWER(username) = ?
        """, (clean_input, clean_input))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=404,
                detail="User account could not be found."
            )

        user = dict_from_row(row)
        matched = verify_code_match(user["email"], "password_reset", clean_code)
        if not matched:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset code. Please request a new security code."
            )

        new_hash = hash_password(new_pw)
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user["id"]))
        conn.commit()

        return {
            "success": True,
            "message": f"Password for @{user['username']} updated successfully! You can now sign in."
        }
    finally:
        conn.close()

