import time
import uuid
import os
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

class LoginRequest(BaseModel):
    emailOrUsername: str
    password: str

class SwitchDemoRequest(BaseModel):
    username: str

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

        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, name, bio, avatar_url, is_verified, is_admin, role)
            VALUES (?, ?, ?, ?, ?, '', '', 0, 0, 'user')
        """, (user_id, clean_user, clean_email, pw_hash, body.name.strip()))
        conn.commit()

        token = sign_token({"id": user_id, "username": body.username.strip().lower(), "role": "user"})

        safe_user = {
            "id": user_id,
            "username": body.username.strip().lower(),
            "email": body.email.strip().lower(),
            "name": body.name.strip(),
            "bio": "",
            "avatar_url": "",
            "is_verified": False,
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
