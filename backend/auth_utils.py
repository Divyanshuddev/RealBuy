import os
import time
import bcrypt
import jwt
from typing import Optional
from fastapi import Request, HTTPException, status
from backend.database import get_connection, dict_from_row

JWT_SECRET = os.getenv("JWT_SECRET", "realbuy_super_secret_jwt_key_2026")
JWT_ALGORITHM = "HS256"
COOKIE_NAME = "realbuy_token"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def sign_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = int(time.time()) + (30 * 24 * 3600)  # 30 days
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None

def get_current_user_from_request(request: Request) -> Optional[dict]:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    payload = decode_token(token)
    if not payload or "id" not in payload:
        return None

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                u.id, u.username, u.email, u.name, u.bio, u.avatar_url, u.is_verified, u.is_admin, u.role, u.created_at,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
                (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id) as reviews_count,
                (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id AND is_verified_purchase = 1) as verified_reviews_count,
                (SELECT COALESCE(SUM(helpful_count), 0) FROM product_reviews WHERE user_id = u.id) as avg_helpfulness
            FROM users u
            WHERE u.id = ?
        """, (payload["id"],))
        row = cursor.fetchone()
        if not row:
            return None
        user = dict_from_row(row)
        user["is_verified"] = bool(user["is_verified"])
        user["is_admin"] = bool(user["is_admin"])
        return user
    finally:
        conn.close()

def require_current_user(request: Request) -> dict:
    user = get_current_user_from_request(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user
