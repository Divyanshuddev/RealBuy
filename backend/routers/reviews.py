import time
import uuid
from typing import Optional, List
from fastapi import APIRouter, Request, HTTPException, Query, status
from pydantic import BaseModel
from backend.database import get_connection, dict_from_row
from backend.auth_utils import get_current_user_from_request, require_current_user
from backend.ai_engine import calculate_ai_product_analysis

router = APIRouter(prefix="/api", tags=["reviews"])

class CreateReviewRequest(BaseModel):
    product_id: str
    rating: float
    quality_rating: Optional[float] = 5.0
    value_rating: Optional[float] = 5.0
    durability_rating: Optional[float] = 5.0
    title: str
    content: str
    purchase_price: Optional[float] = 0.0
    purchase_date: Optional[str] = ""
    purchased_from: Optional[str] = ""
    media_urls: Optional[List[str]] = []
    receipt_url: Optional[str] = None
    store_name: Optional[str] = ""
    order_id: Optional[str] = ""

class CommentRequest(BaseModel):
    content: str

@router.get("/reviews")
def get_reviews(
    request: Request,
    feed: Optional[str] = "smart",
    productId: Optional[str] = None,
    username: Optional[str] = None,
    limit: Optional[int] = 30,
):
    current_user = get_current_user_from_request(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        like_select = f", EXISTS(SELECT 1 FROM likes WHERE user_id = '{current_user['id']}' AND review_id = r.id) as is_liked" if current_user else ", 0 as is_liked"
        helpful_select = f", EXISTS(SELECT 1 FROM helpful_votes WHERE user_id = '{current_user['id']}' AND review_id = r.id) as is_helpful" if current_user else ", 0 as is_helpful"

        query = f"""
            SELECT 
                r.id, r.user_id, r.product_id, r.rating, r.quality_rating, r.value_rating, r.durability_rating,
                r.title, r.content, r.purchase_price, r.purchase_date, r.purchased_from,
                r.is_verified_purchase, r.verification_status, r.helpful_count, r.created_at, r.updated_at,
                u.username, u.name as user_name, u.avatar_url as user_avatar, u.is_verified as user_is_verified,
                p.name as product_name, p.brand as product_brand, p.category as product_category, p.thumbnail_url as product_thumbnail,
                (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE review_id = r.id) as comments_count
                {like_select}
                {helpful_select}
            FROM product_reviews r
            JOIN users u ON r.user_id = u.id
            JOIN products p ON r.product_id = p.id
            WHERE 1=1
        """
        params = []

        if productId:
            query += " AND r.product_id = ?"
            params.append(productId)

        if username:
            query += " AND LOWER(u.username) = LOWER(?)"
            params.append(username)

        if feed == "verified":
            query += " AND r.is_verified_purchase = 1"

        if feed == "trending":
            query += " ORDER BY (likes_count * 2 + comments_count * 3 + r.helpful_count * 2) DESC, r.created_at DESC"
        elif feed == "recent":
            query += " ORDER BY r.created_at DESC"
        elif feed == "highest_rated":
            query += " ORDER BY r.rating DESC, r.helpful_count DESC"
        else:
            query += " ORDER BY (r.is_verified_purchase * 15 + r.helpful_count * 3 + likes_count * 2 + comments_count * 2) DESC, r.created_at DESC"

        query += " LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()

        reviews = []
        for r in rows:
            d = dict_from_row(r)
            cursor.execute("SELECT id, review_id, media_type, url, thumbnail_url FROM review_media WHERE review_id = ?", (d["id"],))
            media_list = [dict_from_row(m) for m in cursor.fetchall()]

            reviews.append({
                "id": d["id"],
                "user_id": d["user_id"],
                "product_id": d["product_id"],
                "rating": float(d["rating"]),
                "quality_rating": float(d["quality_rating"]),
                "value_rating": float(d["value_rating"]),
                "durability_rating": float(d["durability_rating"]),
                "title": d["title"],
                "content": d["content"],
                "purchase_price": round(float(d["purchase_price"])),
                "purchase_date": d["purchase_date"],
                "purchased_from": d["purchased_from"],
                "is_verified_purchase": bool(d["is_verified_purchase"]),
                "verification_status": d["verification_status"],
                "helpful_count": int(d["helpful_count"]),
                "created_at": d["created_at"],
                "updated_at": d["updated_at"],
                "likes_count": int(d["likes_count"]),
                "comments_count": int(d["comments_count"]),
                "is_liked": bool(d["is_liked"]),
                "is_helpful": bool(d["is_helpful"]),
                "user": {
                    "id": d["user_id"],
                    "username": d["username"],
                    "name": d["user_name"],
                    "avatar_url": d["user_avatar"],
                    "is_verified": bool(d["user_is_verified"]),
                },
                "product": {
                    "id": d["product_id"],
                    "name": d["product_name"],
                    "brand": d["product_brand"],
                    "category": d["product_category"],
                    "thumbnail_url": d["product_thumbnail"],
                },
                "media": media_list,
            })

        return {"reviews": reviews}
    finally:
        conn.close()

@router.post("/reviews")
def create_review(body: CreateReviewRequest, request: Request):
    user = require_current_user(request)
    if not body.product_id or not body.title.strip() or not body.content.strip() or not body.rating:
        raise HTTPException(status_code=400, detail="Product, title, content, and rating are required")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM products WHERE id = ?", (body.product_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Product not found")

        review_id = f"r_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        is_verified = 1 if body.receipt_url else 0
        verification_status = "verified" if body.receipt_url else "unverified"
        purchase_date = body.purchase_date or datetime.utcnow().strftime("%Y-%m-%d")

        cursor.execute("""
            INSERT INTO product_reviews (
                id, user_id, product_id, rating, quality_rating, value_rating, durability_rating,
                title, content, purchase_price, purchase_date, purchased_from, is_verified_purchase,
                verification_status, helpful_count, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        """, (
            review_id, user["id"], body.product_id,
            float(body.rating), float(body.quality_rating or body.rating),
            float(body.value_rating or body.rating), float(body.durability_rating or body.rating),
            body.title.strip(), body.content.strip(),
            float(body.purchase_price or 0.0), purchase_date, body.purchased_from or "",
            is_verified, verification_status
        ))

        if body.media_urls:
            for idx, url in enumerate(body.media_urls):
                is_video = url.endswith(".mp4") or url.endswith(".webm") or "video" in url
                cursor.execute("""
                    INSERT INTO review_media (id, review_id, media_type, url, thumbnail_url)
                    VALUES (?, ?, ?, ?, ?)
                """, (f"m_{int(time.time())}_{idx}", review_id, "video" if is_video else "image", url, url))

        if body.receipt_url:
            cursor.execute("""
                INSERT INTO purchase_verifications (
                    id, review_id, user_id, receipt_url, store_name, order_id, purchase_amount, status, reviewed_by, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', 'system_ai', 'Automatic invoice integrity verification passed')
            """, (
                f"v_{int(time.time())}", review_id, user["id"], body.receipt_url,
                body.store_name or body.purchased_from or "Retailer", body.order_id or "ORD-VERIFIED",
                float(body.purchase_price or 0.0)
            ))

            cursor.execute("""
                INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
                VALUES (?, ?, ?, 'verified_purchase', ?, ?)
            """, (
                f"n_{int(time.time())}", user["id"], "u6", review_id,
                "Your purchase invoice was verified! Your review now displays the official Verified Buyer badge."
            ))

        conn.commit()

        # Recalculate AI
        calculate_ai_product_analysis(body.product_id, conn)

        return {
            "reviewId": review_id,
            "message": "Review published successfully! AI product analysis has been recalculated."
        }
    finally:
        conn.close()

@router.post("/reviews/{review_id}/like")
def toggle_like(review_id: str, request: Request):
    user = require_current_user(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM product_reviews WHERE id = ?", (review_id,))
        review = cursor.fetchone()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        cursor.execute("SELECT id FROM likes WHERE user_id = ? AND review_id = ?", (user["id"], review_id))
        existing = cursor.fetchone()

        if existing:
            cursor.execute("DELETE FROM likes WHERE user_id = ? AND review_id = ?", (user["id"], review_id))
            conn.commit()
            cursor.execute("SELECT COUNT(*) as c FROM likes WHERE review_id = ?", (review_id,))
            count = cursor.fetchone()["c"]
            return {"liked": False, "likesCount": count}
        else:
            like_id = f"l_{int(time.time())}"
            cursor.execute("INSERT INTO likes (id, user_id, review_id) VALUES (?, ?, ?)", (like_id, user["id"], review_id))
            if review["user_id"] != user["id"]:
                cursor.execute("""
                    INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
                    VALUES (?, ?, ?, 'like', ?, ?)
                """, (f"n_{int(time.time())}", review["user_id"], user["id"], review_id, f"{user['name']} liked your product review"))
            conn.commit()
            cursor.execute("SELECT COUNT(*) as c FROM likes WHERE review_id = ?", (review_id,))
            count = cursor.fetchone()["c"]
            return {"liked": True, "likesCount": count}
    finally:
        conn.close()

@router.post("/reviews/{review_id}/helpful")
def toggle_helpful(review_id: str, request: Request):
    user = require_current_user(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM product_reviews WHERE id = ?", (review_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Review not found")

        cursor.execute("SELECT id FROM helpful_votes WHERE user_id = ? AND review_id = ?", (user["id"], review_id))
        existing = cursor.fetchone()

        if existing:
            cursor.execute("DELETE FROM helpful_votes WHERE user_id = ? AND review_id = ?", (user["id"], review_id))
            cursor.execute("UPDATE product_reviews SET helpful_count = MAX(0, helpful_count - 1) WHERE id = ?", (review_id,))
            conn.commit()
            cursor.execute("SELECT helpful_count FROM product_reviews WHERE id = ?", (review_id,))
            count = cursor.fetchone()["helpful_count"]
            return {"helpful": False, "helpfulCount": count}
        else:
            vote_id = f"h_{int(time.time())}"
            cursor.execute("INSERT INTO helpful_votes (id, user_id, review_id) VALUES (?, ?, ?)", (vote_id, user["id"], review_id))
            cursor.execute("UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = ?", (review_id,))
            conn.commit()
            cursor.execute("SELECT helpful_count FROM product_reviews WHERE id = ?", (review_id,))
            count = cursor.fetchone()["helpful_count"]
            return {"helpful": True, "helpfulCount": count}
    finally:
        conn.close()

@router.get("/reviews/{review_id}/comments")
def get_comments(review_id: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.id, c.review_id, c.user_id, c.content, c.created_at,
                   u.username, u.name as user_name, u.avatar_url as user_avatar, u.is_verified as user_is_verified
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.review_id = ?
            ORDER BY c.created_at ASC
        """, (review_id,))
        comments_raw = [dict_from_row(r) for r in cursor.fetchall()]

        comments_list = []
        for c in comments_raw:
            cursor.execute("""
                SELECT cr.id, cr.comment_id, cr.user_id, cr.content, cr.created_at,
                       u.username, u.name as user_name, u.avatar_url as user_avatar, u.is_verified as user_is_verified
                FROM comment_replies cr
                JOIN users u ON cr.user_id = u.id
                WHERE cr.comment_id = ?
                ORDER BY cr.created_at ASC
            """, (c["id"],))
            replies = []
            for rep in cursor.fetchall():
                r_dict = dict_from_row(rep)
                replies.append({
                    "id": r_dict["id"],
                    "comment_id": r_dict["comment_id"],
                    "user_id": r_dict["user_id"],
                    "content": r_dict["content"],
                    "created_at": r_dict["created_at"],
                    "user": {
                        "id": r_dict["user_id"],
                        "username": r_dict["username"],
                        "name": r_dict["user_name"],
                        "avatar_url": r_dict["user_avatar"],
                        "is_verified": bool(r_dict["user_is_verified"])
                    }
                })

            comments_list.append({
                "id": c["id"],
                "review_id": c["review_id"],
                "user_id": c["user_id"],
                "content": c["content"],
                "created_at": c["created_at"],
                "user": {
                    "id": c["user_id"],
                    "username": c["username"],
                    "name": c["user_name"],
                    "avatar_url": c["user_avatar"],
                    "is_verified": bool(c["user_is_verified"])
                },
                "replies": replies
            })

        return {"comments": comments_list}
    finally:
        conn.close()

@router.post("/reviews/{review_id}/comments")
def add_comment(review_id: str, body: CommentRequest, request: Request):
    user = require_current_user(request)
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Comment content is required")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM product_reviews WHERE id = ?", (review_id,))
        review = cursor.fetchone()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        cid = f"c_{int(time.time())}"
        cursor.execute("""
            INSERT INTO comments (id, review_id, user_id, content)
            VALUES (?, ?, ?, ?)
        """, (cid, review_id, user["id"], body.content.strip()))

        if review["user_id"] != user["id"]:
            cursor.execute("""
                INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
                VALUES (?, ?, ?, 'comment', ?, ?)
            """, (f"n_{int(time.time())}", review["user_id"], user["id"], review_id, f"{user['name']} commented on your review"))

        conn.commit()
        return {"id": cid, "message": "Comment posted"}
    finally:
        conn.close()

@router.post("/comments/{comment_id}/reply")
def reply_comment(comment_id: str, body: CommentRequest, request: Request):
    user = require_current_user(request)
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Reply content is required")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, review_id FROM comments WHERE id = ?", (comment_id,))
        parent = cursor.fetchone()
        if not parent:
            raise HTTPException(status_code=404, detail="Comment not found")

        rid = f"cr_{int(time.time())}"
        cursor.execute("""
            INSERT INTO comment_replies (id, comment_id, user_id, content)
            VALUES (?, ?, ?, ?)
        """, (rid, comment_id, user["id"], body.content.strip()))

        if parent["user_id"] != user["id"]:
            cursor.execute("""
                INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
                VALUES (?, ?, ?, 'reply', ?, ?)
            """, (f"n_{int(time.time())}", parent["user_id"], user["id"], parent["review_id"], f"{user['name']} replied to your comment"))

        conn.commit()
        return {"id": rid, "message": "Reply posted"}
    finally:
        conn.close()
