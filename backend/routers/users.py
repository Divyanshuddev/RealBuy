import time
import uuid
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from backend.database import get_connection, dict_from_row
from backend.auth_utils import get_current_user_from_request, require_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

@router.get("/{username}")
def get_user_profile(username: str, request: Request):
    current_user = get_current_user_from_request(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        follow_select = f", EXISTS(SELECT 1 FROM follows WHERE follower_id = '{current_user['id']}' AND following_id = u.id) as is_following" if current_user else ", 0 as is_following"

        cursor.execute(f"""
            SELECT 
                u.id, u.username, u.email, u.name, u.bio, u.avatar_url, u.is_verified, u.is_admin, u.role, u.created_at,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
                (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id) as reviews_count,
                (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id AND is_verified_purchase = 1) as verified_reviews_count,
                (SELECT COALESCE(SUM(helpful_count), 0) FROM product_reviews WHERE user_id = u.id) as avg_helpfulness
                {follow_select}
            FROM users u
            WHERE LOWER(u.username) = LOWER(?)
        """, (username,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        user = dict_from_row(row)
        user["is_verified"] = bool(user["is_verified"])
        user["is_admin"] = bool(user["is_admin"])
        user["is_following"] = bool(user["is_following"])

        cursor.execute("""
            SELECT 
                r.*, 
                p.name as product_name, p.brand as product_brand, p.category as product_category, p.thumbnail_url as product_thumbnail,
                (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE review_id = r.id) as comments_count
            FROM product_reviews r
            JOIN products p ON r.product_id = p.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        """, (user["id"],))
        review_rows = cursor.fetchall()
        reviews = []
        for rr in review_rows:
            rd = dict_from_row(rr)
            cursor.execute("SELECT id, review_id, media_type, url, thumbnail_url FROM review_media WHERE review_id = ?", (rd["id"],))
            media = [dict_from_row(m) for m in cursor.fetchall()]
            reviews.append({
                **rd,
                "is_verified_purchase": bool(rd["is_verified_purchase"]),
                "likes_count": int(rd["likes_count"]),
                "comments_count": int(rd["comments_count"]),
                "user": user,
                "product": {
                    "id": rd["product_id"],
                    "name": rd["product_name"],
                    "brand": rd["product_brand"],
                    "category": rd["product_category"],
                    "thumbnail_url": rd["product_thumbnail"]
                },
                "media": media
            })

        cursor.execute("""
            SELECT p.*,
                (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = p.id) as avg_rating,
                (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count
            FROM saved_products s
            JOIN products p ON s.product_id = p.id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
        """, (user["id"],))
        saved_products = [dict_from_row(p) for p in cursor.fetchall()]

        return {
            "user": user,
            "reviews": reviews,
            "savedProducts": saved_products
        }
    finally:
        conn.close()

@router.put("/{username}")
def update_profile(username: str, body: UpdateProfileRequest, request: Request):
    user = require_current_user(request)
    if user["username"].lower() != username.lower() and not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Permission denied")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        updates = []
        params = []
        if body.name is not None:
            updates.append("name = ?")
            params.append(body.name.strip())
        if body.bio is not None:
            updates.append("bio = ?")
            params.append(body.bio.strip())
        if body.avatar_url is not None:
            updates.append("avatar_url = ?")
            params.append(body.avatar_url.strip())

        if updates:
            params.append(user["id"])
            cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()

        return {"message": "Profile updated successfully"}
    finally:
        conn.close()

@router.post("/{username}/follow")
def toggle_follow(username: str, request: Request):
    current_user = require_current_user(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM users WHERE LOWER(username) = LOWER(?)", (username,))
        target = cursor.fetchone()
        if not target:
            raise HTTPException(status_code=404, detail="User not found")

        target_id = target["id"]
        if target_id == current_user["id"]:
            raise HTTPException(status_code=400, detail="Cannot follow yourself")

        cursor.execute("SELECT id FROM follows WHERE follower_id = ? AND following_id = ?", (current_user["id"], target_id))
        existing = cursor.fetchone()

        if existing:
            cursor.execute("DELETE FROM follows WHERE follower_id = ? AND following_id = ?", (current_user["id"], target_id))
            conn.commit()
            cursor.execute("SELECT COUNT(*) as c FROM follows WHERE following_id = ?", (target_id,))
            count = cursor.fetchone()["c"]
            return {"following": False, "followersCount": count}
        else:
            fid = f"f_{int(time.time())}_{uuid.uuid4().hex[:4]}"
            cursor.execute("INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)", (fid, current_user["id"], target_id))
            cursor.execute("""
                INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
                VALUES (?, ?, ?, 'follow', ?, ?)
            """, (f"n_{fid}", target_id, current_user["id"], current_user["id"], f"{current_user['name']} started following your reviews"))
            conn.commit()
            cursor.execute("SELECT COUNT(*) as c FROM follows WHERE following_id = ?", (target_id,))
            count = cursor.fetchone()["c"]
            return {"following": True, "followersCount": count}
    finally:
        conn.close()
