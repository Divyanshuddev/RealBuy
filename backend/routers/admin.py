from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from backend.database import get_connection, dict_from_row
from backend.auth_utils import require_current_user
from backend.ai_engine import calculate_ai_product_analysis

router = APIRouter(prefix="/api/admin", tags=["admin"])

class ModerationActionRequest(BaseModel):
    action: str
    id: Optional[str] = None
    reviewId: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

@router.get("/stats")
def get_admin_stats(request: Request):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as c FROM users")
        total_users = cursor.fetchone()["c"]

        cursor.execute("SELECT COUNT(*) as c FROM products")
        total_products = cursor.fetchone()["c"]

        cursor.execute("SELECT COUNT(*) as c FROM product_reviews")
        total_reviews = cursor.fetchone()["c"]

        cursor.execute("SELECT COUNT(*) as c FROM product_reviews WHERE is_verified_purchase = 1")
        total_verified_reviews = cursor.fetchone()["c"]

        cursor.execute("SELECT COUNT(*) as c FROM ai_product_analyses")
        ai_analyses_count = cursor.fetchone()["c"]

        cursor.execute("SELECT id, username, name, email, avatar_url, role, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 10")
        recent_users = [dict_from_row(r) for r in cursor.fetchall()]

        return {
            "stats": {
                "totalUsers": total_users,
                "totalProducts": total_products,
                "totalReviews": total_reviews,
                "totalVerifiedReviews": total_verified_reviews,
                "aiAnalysesCount": ai_analyses_count,
            },
            "recentUsers": recent_users,
        }
    finally:
        conn.close()

@router.get("/moderation")
def get_moderation_queue(request: Request):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT rep.*, u.username as reporter_username
            FROM reports rep
            JOIN users u ON rep.reporter_id = u.id
            WHERE rep.status = 'pending'
            ORDER BY rep.created_at DESC
        """)
        reports = [dict_from_row(r) for r in cursor.fetchall()]

        cursor.execute("""
            SELECT pv.*, u.username, u.name as user_name, r.title as review_title, p.name as product_name
            FROM purchase_verifications pv
            JOIN users u ON pv.user_id = u.id
            JOIN product_reviews r ON pv.review_id = r.id
            JOIN products p ON r.product_id = p.id
            ORDER BY pv.created_at DESC
        """)
        verifications = [dict_from_row(r) for r in cursor.fetchall()]

        return {
            "reports": reports,
            "verifications": verifications
        }
    finally:
        conn.close()

@router.post("/moderation")
def handle_moderation_action(body: ModerationActionRequest, request: Request):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        action = body.action

        if action == "resolve_report":
            cursor.execute("UPDATE reports SET status = ? WHERE id = ?", (body.status or "resolved", body.id))
            conn.commit()
            return {"message": f"Report marked as {body.status or 'resolved'}"}

        elif action == "delete_reported_review":
            cursor.execute("DELETE FROM product_reviews WHERE id = ?", (body.reviewId,))
            cursor.execute("DELETE FROM likes WHERE review_id = ?", (body.reviewId,))
            cursor.execute("DELETE FROM comments WHERE review_id = ?", (body.reviewId,))
            cursor.execute("DELETE FROM review_media WHERE review_id = ?", (body.reviewId,))
            cursor.execute("UPDATE reports SET status = 'resolved' WHERE target_id = ?", (body.reviewId,))
            conn.commit()
            return {"message": "Reported review deleted successfully"}

        elif action == "verify_purchase":
            verif_status = body.status or "verified"
            cursor.execute("UPDATE purchase_verifications SET status = ?, notes = ? WHERE id = ?", 
                           (verif_status, body.notes or "", body.id))
            is_ver = 1 if verif_status == "verified" else 0
            cursor.execute("UPDATE product_reviews SET is_verified_purchase = ?, verification_status = ? WHERE id = ?",
                           (is_ver, verif_status, body.reviewId))
            conn.commit()

            cursor.execute("SELECT product_id FROM product_reviews WHERE id = ?", (body.reviewId,))
            p_row = cursor.fetchone()
            if p_row:
                calculate_ai_product_analysis(p_row["product_id"], conn)

            return {"message": f"Verification status updated to {verif_status}"}

        elif action == "recalculate_all_ai":
            cursor.execute("SELECT id FROM products")
            pids = [r["id"] for r in cursor.fetchall()]
            for pid in pids:
                calculate_ai_product_analysis(pid, conn)
            return {"message": f"Successfully recalculated AI product intelligence for all {len(pids)} products."}

        else:
            raise HTTPException(status_code=400, detail="Invalid moderation action")
    finally:
        conn.close()
