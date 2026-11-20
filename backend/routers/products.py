import json
import time
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Request, HTTPException, Query, status
from pydantic import BaseModel
from backend.database import get_connection, dict_from_row
from backend.auth_utils import get_current_user_from_request, require_current_user
from backend.ai_engine import calculate_ai_product_analysis, answer_product_question

router = APIRouter(prefix="/api/products", tags=["products"])

class CreateProductRequest(BaseModel):
    name: str
    brand: str
    model: Optional[str] = ""
    category: str
    description: Optional[str] = ""
    thumbnail_url: Optional[str] = ""
    images: Optional[List[str]] = []
    product_url: Optional[str] = ""
    store_links: Optional[List[dict]] = []
    specs: Optional[dict] = {}

class AskAIRequest(BaseModel):
    question: str

@router.get("")
def get_products(
    request: Request,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "popular",
    minRating: Optional[float] = 0.0,
):
    current_user = get_current_user_from_request(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        saved_select = f", EXISTS(SELECT 1 FROM saved_products WHERE user_id = '{current_user['id']}' AND product_id = p.id) as is_saved" if current_user else ", 0 as is_saved"

        query = f"""
            SELECT 
                p.id, p.name, p.brand, p.model, p.category, p.description, p.thumbnail_url, p.images_json, p.product_url, p.store_links_json, p.specs_json, p.created_at,
                COUNT(DISTINCT r.id) as review_count,
                COUNT(DISTINCT CASE WHEN r.is_verified_purchase = 1 THEN r.id END) as verified_review_count,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COALESCE(AVG(r.quality_rating), 0) as avg_quality,
                COALESCE(AVG(r.value_rating), 0) as avg_value,
                COALESCE(AVG(r.durability_rating), 0) as avg_durability,
                COALESCE(MIN(r.purchase_price), 0) as min_price,
                COALESCE(MAX(r.purchase_price), 0) as max_price,
                COALESCE(AVG(r.purchase_price), 0) as avg_price,
                ai.recommendation as ai_recommendation,
                ai.sentiment_score as ai_sentiment_score,
                ai.confidence_level as ai_confidence_level,
                ai.pros_json as ai_pros_json,
                ai.cons_json as ai_cons_json,
                ai.durability_insights as ai_durability_insights,
                ai.value_analysis as ai_value_analysis
                {saved_select}
            FROM products p
            LEFT JOIN product_reviews r ON p.id = r.product_id
            LEFT JOIN ai_product_analyses ai ON p.id = ai.product_id
            WHERE 1=1
        """
        params = []

        if category and category != "All":
            query += " AND LOWER(p.category) = LOWER(?)"
            params.append(category)

        if search:
            query += " AND (LOWER(p.name) LIKE ? OR LOWER(p.brand) LIKE ? OR LOWER(p.model) LIKE ? OR LOWER(p.category) LIKE ?)"
            term = f"%{search.lower()}%"
            params.extend([term, term, term, term])

        query += " GROUP BY p.id"

        if minRating and minRating > 0:
            query += f" HAVING avg_rating >= {minRating}"

        if sort == "highest_rated":
            query += " ORDER BY avg_rating DESC, review_count DESC"
        elif sort == "recent":
            query += " ORDER BY p.created_at DESC"
        elif sort == "price_asc":
            query += " ORDER BY min_price ASC"
        elif sort == "price_desc":
            query += " ORDER BY max_price DESC"
        else:
            query += " ORDER BY review_count DESC, avg_rating DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        products = []
        for r in rows:
            d = dict_from_row(r)
            d["avg_rating"] = round(float(d["avg_rating"]), 1)
            d["avg_quality"] = round(float(d["avg_quality"]), 1)
            d["avg_value"] = round(float(d["avg_value"]), 1)
            d["avg_durability"] = round(float(d["avg_durability"]), 1)
            d["min_price"] = round(float(d["min_price"]))
            d["max_price"] = round(float(d["max_price"]))
            d["avg_price"] = round(float(d["avg_price"]))
            d["is_saved"] = bool(d["is_saved"])
            d["specs"] = json.loads(d["specs_json"]) if d.get("specs_json") else {}
            d["images"] = json.loads(d["images_json"]) if d.get("images_json") else ([d["thumbnail_url"]] if d.get("thumbnail_url") else [])
            d["product_url"] = d.get("product_url") or ""
            d["store_links"] = json.loads(d["store_links_json"]) if d.get("store_links_json") else ([{"title": "Store", "url": d["product_url"]}] if d.get("product_url") else [])
            d["ai_pros"] = json.loads(d["ai_pros_json"]) if d.get("ai_pros_json") else []
            d["ai_cons"] = json.loads(d["ai_cons_json"]) if d.get("ai_cons_json") else []
            products.append(d)

        return {"products": products}
    finally:
        conn.close()

@router.post("")
def create_product(body: CreateProductRequest, request: Request):
    require_current_user(request)

    # Validate product images: Min 1, Max 5
    images = [img.strip() for img in (body.images or []) if img and img.strip()]
    if not images and body.thumbnail_url and body.thumbnail_url.strip():
        images = [body.thumbnail_url.strip()]

    if len(images) < 1:
        raise HTTPException(
            status_code=400,
            detail="Minimum 1 product image is required. Please upload at least one image."
        )
    if len(images) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 product images allowed. Please limit selection to 5 images."
        )

    # Process multiple store links
    clean_store_links = []
    for item in (body.store_links or []):
        if isinstance(item, dict):
            u = item.get("url", "").strip()
            if u:
                t = item.get("title", "").strip()
                clean_store_links.append({"title": t or "Store", "url": u})
        elif isinstance(item, str) and item.strip():
            clean_store_links.append({"title": "Store", "url": item.strip()})

    main_url = (body.product_url or "").strip()
    if not main_url and clean_store_links:
        main_url = clean_store_links[0]["url"]
    elif main_url and not any(l["url"] == main_url for l in clean_store_links):
        clean_store_links.insert(0, {"title": "Store", "url": main_url})

    product_id = f"p_{int(time.time())}_{uuid.uuid4().hex[:4]}"
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO products (id, name, brand, model, category, description, thumbnail_url, images_json, product_url, store_links_json, specs_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            product_id,
            body.name.strip(),
            body.brand.strip(),
            body.model.strip() if body.model else "",
            body.category,
            body.description or f"Community reviewed {body.brand} {body.name}",
            images[0],
            json.dumps(images),
            main_url,
            json.dumps(clean_store_links),
            json.dumps(body.specs or {})
        ))
        conn.commit()

        calculate_ai_product_analysis(product_id, conn)

        return {
            "id": product_id,
            "message": "Product created successfully",
            "images": images,
            "store_links": clean_store_links
        }
    finally:
        conn.close()

@router.get("/compare")
def compare_products(ids: str = Query(...)):
    id_list = [i.strip() for i in ids.split(",") if i.strip()][:4]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 products to compare")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        comparison_list = []

        for pid in id_list:
            cursor.execute("""
                SELECT 
                    p.id, p.name, p.brand, p.model, p.category, p.description, p.thumbnail_url, p.specs_json,
                    COUNT(DISTINCT r.id) as review_count,
                    COUNT(DISTINCT CASE WHEN r.is_verified_purchase = 1 THEN r.id END) as verified_review_count,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COALESCE(AVG(r.quality_rating), 0) as avg_quality,
                    COALESCE(AVG(r.value_rating), 0) as avg_value,
                    COALESCE(AVG(r.durability_rating), 0) as avg_durability,
                    COALESCE(MIN(r.purchase_price), 0) as min_price,
                    COALESCE(MAX(r.purchase_price), 0) as max_price,
                    COALESCE(AVG(r.purchase_price), 0) as avg_price
                FROM products p
                LEFT JOIN product_reviews r ON p.id = r.product_id
                WHERE p.id = ?
                GROUP BY p.id
            """, (pid,))
            row = cursor.fetchone()
            if not row:
                continue

            product = dict_from_row(row)
            cursor.execute("SELECT * FROM ai_product_analyses WHERE product_id = ?", (pid,))
            ai_row = cursor.fetchone()
            if ai_row:
                analysis = dict_from_row(ai_row)
                analysis["pros"] = json.loads(analysis["pros_json"]) if analysis.get("pros_json") else []
                analysis["cons"] = json.loads(analysis["cons_json"]) if analysis.get("cons_json") else []
            else:
                analysis = calculate_ai_product_analysis(pid, conn)
                analysis["pros"] = json.loads(analysis["pros_json"]) if analysis.get("pros_json") else []
                analysis["cons"] = json.loads(analysis["cons_json"]) if analysis.get("cons_json") else []

            product["avg_rating"] = round(float(product["avg_rating"]), 1)
            product["avg_quality"] = round(float(product["avg_quality"]), 1)
            product["avg_value"] = round(float(product["avg_value"]), 1)
            product["avg_durability"] = round(float(product["avg_durability"]), 1)
            product["min_price"] = round(float(product["min_price"]))
            product["max_price"] = round(float(product["max_price"]))
            product["avg_price"] = round(float(product["avg_price"]))
            product["specs"] = json.loads(product["specs_json"]) if product.get("specs_json") else {}
            product["aiAnalysis"] = analysis
            comparison_list.append(product)

        sorted_by_rating = sorted(comparison_list, key=lambda x: x["avg_rating"], reverse=True)
        sorted_by_value = sorted(comparison_list, key=lambda x: x["avg_value"], reverse=True)

        winner_rating = sorted_by_rating[0] if sorted_by_rating else None
        winner_value = sorted_by_value[0] if sorted_by_value else None

        ai_verdict = {
            "overallWinner": winner_rating["name"] if winner_rating else "",
            "overallWinnerReason": f"Holds highest community satisfaction ({winner_rating['avg_rating']}/5) and superior sentiment score ({winner_rating['aiAnalysis']['sentiment_score']}%)." if winner_rating else "",
            "valueWinner": winner_value["name"] if winner_value else "",
            "valueWinnerReason": f"Delivers the highest customer value-for-money score ({winner_value['avg_value']}/5) at average price ${winner_value['avg_price']}." if winner_value else "",
            "recommendationSummary": f"If prioritizing ultimate build and raw performance, choose **{winner_rating['brand']} {winner_rating['name']}**. For maximum feature utility per dollar spent, **{winner_value['brand']} {winner_value['name']}** offers the smartest buy." if (winner_rating and winner_value) else ""
        }

        return {"products": comparison_list, "aiVerdict": ai_verdict}
    finally:
        conn.close()

@router.get("/{product_id}")
def get_product_detail(product_id: str, request: Request):
    current_user = get_current_user_from_request(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        saved_select = f", EXISTS(SELECT 1 FROM saved_products WHERE user_id = '{current_user['id']}' AND product_id = p.id) as is_saved" if current_user else ", 0 as is_saved"

        cursor.execute(f"""
            SELECT 
                p.id, p.name, p.brand, p.model, p.category, p.description, p.thumbnail_url, p.images_json, p.product_url, p.store_links_json, p.specs_json, p.created_at,
                COUNT(DISTINCT r.id) as review_count,
                COUNT(DISTINCT CASE WHEN r.is_verified_purchase = 1 THEN r.id END) as verified_review_count,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COALESCE(AVG(r.quality_rating), 0) as avg_quality,
                COALESCE(AVG(r.value_rating), 0) as avg_value,
                COALESCE(AVG(r.durability_rating), 0) as avg_durability,
                COALESCE(MIN(r.purchase_price), 0) as min_price,
                COALESCE(MAX(r.purchase_price), 0) as max_price,
                COALESCE(AVG(r.purchase_price), 0) as avg_price
                {saved_select}
            FROM products p
            LEFT JOIN product_reviews r ON p.id = r.product_id
            WHERE p.id = ?
            GROUP BY p.id
        """, (product_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Product not found")

        product = dict_from_row(row)
        product["avg_rating"] = round(float(product["avg_rating"]), 1)
        product["avg_quality"] = round(float(product["avg_quality"]), 1)
        product["avg_value"] = round(float(product["avg_value"]), 1)
        product["avg_durability"] = round(float(product["avg_durability"]), 1)
        product["min_price"] = round(float(product["min_price"]))
        product["max_price"] = round(float(product["max_price"]))
        product["avg_price"] = round(float(product["avg_price"]))
        product["is_saved"] = bool(product["is_saved"])
        product["specs"] = json.loads(product["specs_json"]) if product.get("specs_json") else {}
        product["images"] = json.loads(product["images_json"]) if product.get("images_json") else ([product["thumbnail_url"]] if product.get("thumbnail_url") else [])
        product["product_url"] = product.get("product_url") or ""
        product["store_links"] = json.loads(product["store_links_json"]) if product.get("store_links_json") else ([{"title": "Store", "url": product["product_url"]}] if product.get("product_url") else [])

        cursor.execute("SELECT * FROM ai_product_analyses WHERE product_id = ?", (product_id,))
        ai_row = cursor.fetchone()
        if ai_row:
            analysis = dict_from_row(ai_row)
            analysis["pros"] = json.loads(analysis["pros_json"]) if analysis.get("pros_json") else []
            analysis["cons"] = json.loads(analysis["cons_json"]) if analysis.get("cons_json") else []
            analysis["positive_feedback"] = json.loads(analysis["positive_feedback_json"]) if analysis.get("positive_feedback_json") else []
            analysis["negative_feedback"] = json.loads(analysis["negative_feedback_json"]) if analysis.get("negative_feedback_json") else []
        else:
            analysis = calculate_ai_product_analysis(product_id, conn)
            analysis["pros"] = json.loads(analysis["pros_json"]) if analysis.get("pros_json") else []
            analysis["cons"] = json.loads(analysis["cons_json"]) if analysis.get("cons_json") else []
            analysis["positive_feedback"] = json.loads(analysis["positive_feedback_json"]) if analysis.get("positive_feedback_json") else []
            analysis["negative_feedback"] = json.loads(analysis["negative_feedback_json"]) if analysis.get("negative_feedback_json") else []

        cursor.execute("""
            SELECT 
                SUM(CASE WHEN rating >= 4.5 THEN 1 ELSE 0 END) as stars_5,
                SUM(CASE WHEN rating >= 3.5 AND rating < 4.5 THEN 1 ELSE 0 END) as stars_4,
                SUM(CASE WHEN rating >= 2.5 AND rating < 3.5 THEN 1 ELSE 0 END) as stars_3,
                SUM(CASE WHEN rating >= 1.5 AND rating < 2.5 THEN 1 ELSE 0 END) as stars_2,
                SUM(CASE WHEN rating < 1.5 THEN 1 ELSE 0 END) as stars_1
            FROM product_reviews
            WHERE product_id = ?
        """, (product_id,))
        ratings_dist = dict_from_row(cursor.fetchone())

        cursor.execute("""
            SELECT id, name, brand, category, thumbnail_url,
                (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = products.id) as avg_rating,
                (SELECT COUNT(*) FROM product_reviews WHERE product_id = products.id) as review_count
            FROM products
            WHERE category = ? AND id != ?
            LIMIT 4
        """, (product["category"], product_id))
        similar_products = [dict_from_row(r) for r in cursor.fetchall()]

        return {
            "product": product,
            "analysis": analysis,
            "ratingsDist": ratings_dist,
            "similarProducts": similar_products,
        }
    finally:
        conn.close()

@router.post("/{product_id}/save")
def toggle_save_product(product_id: str, request: Request):
    user = require_current_user(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM saved_products WHERE user_id = ? AND product_id = ?", (user["id"], product_id))
        existing = cursor.fetchone()

        if existing:
            cursor.execute("DELETE FROM saved_products WHERE user_id = ? AND product_id = ?", (user["id"], product_id))
            conn.commit()
            return {"saved": False, "message": "Product removed from saved items"}
        else:
            save_id = f"s_{int(time.time())}_{uuid.uuid4().hex[:4]}"
            cursor.execute("INSERT INTO saved_products (id, user_id, product_id) VALUES (?, ?, ?)", (save_id, user["id"], product_id))
            conn.commit()
            return {"saved": True, "message": "Product saved to your bookmarks"}
    finally:
        conn.close()

@router.post("/{product_id}/ai-analysis")
def recalculate_ai_analysis(product_id: str):
    conn = get_connection()
    try:
        analysis = calculate_ai_product_analysis(product_id, conn)
        analysis["pros"] = json.loads(analysis["pros_json"]) if analysis.get("pros_json") else []
        analysis["cons"] = json.loads(analysis["cons_json"]) if analysis.get("cons_json") else []
        analysis["positive_feedback"] = json.loads(analysis["positive_feedback_json"]) if analysis.get("positive_feedback_json") else []
        analysis["negative_feedback"] = json.loads(analysis["negative_feedback_json"]) if analysis.get("negative_feedback_json") else []
        return {"message": "AI analysis recalculated successfully", "analysis": analysis}
    finally:
        conn.close()

@router.post("/{product_id}/ask-ai")
def ask_ai(product_id: str, body: AskAIRequest):
    if not body.question or not body.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        product_row = cursor.fetchone()
        if not product_row:
            raise HTTPException(status_code=404, detail="Product not found")
        product = dict_from_row(product_row)

        cursor.execute("""
            SELECT r.*, u.name as user_name
            FROM product_reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.helpful_count DESC
        """, (product_id,))
        reviews = [dict_from_row(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM ai_product_analyses WHERE product_id = ?", (product_id,))
        ai_row = cursor.fetchone()
        analysis = None
        if ai_row:
            analysis = dict_from_row(ai_row)
            analysis["pros"] = json.loads(analysis["pros_json"]) if analysis.get("pros_json") else []
            analysis["cons"] = json.loads(analysis["cons_json"]) if analysis.get("cons_json") else []
            analysis["positive_feedback"] = json.loads(analysis["positive_feedback_json"]) if analysis.get("positive_feedback_json") else []
            analysis["negative_feedback"] = json.loads(analysis["negative_feedback_json"]) if analysis.get("negative_feedback_json") else []

        answer = answer_product_question(product, reviews, analysis, body.question.strip())

        return {
            "question": body.question.strip(),
            "answer": answer,
            "reviewsAnalyzed": len(reviews),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        conn.close()
