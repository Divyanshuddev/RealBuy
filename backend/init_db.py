import sqlite3
import os
import json
import time
import uuid
from backend.auth_utils import hash_password

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    is_verified INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT DEFAULT '',
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
    images_json TEXT DEFAULT '[]',
    product_url TEXT DEFAULT '',
    store_links_json TEXT DEFAULT '[]',
    specs_json TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    rating REAL NOT NULL,
    quality_rating REAL NOT NULL,
    value_rating REAL NOT NULL,
    durability_rating REAL NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    purchase_price REAL DEFAULT 0,
    purchase_date TEXT DEFAULT '',
    purchased_from TEXT DEFAULT '',
    is_verified_purchase INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'unverified',
    helpful_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_media (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    media_type TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_verifications (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    receipt_url TEXT NOT NULL,
    store_name TEXT DEFAULT '',
    order_id TEXT DEFAULT '',
    purchase_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comment_replies (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    review_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, review_id)
);

CREATE TABLE IF NOT EXISTS helpful_votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    review_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, review_id)
);

CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS saved_products (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS ai_product_analyses (
    id TEXT PRIMARY KEY,
    product_id TEXT UNIQUE NOT NULL,
    recommendation TEXT NOT NULL,
    recommendation_reason TEXT NOT NULL,
    summary TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    who_should_avoid TEXT NOT NULL,
    sentiment_score REAL NOT NULL,
    positive_pct REAL NOT NULL,
    negative_pct REAL NOT NULL,
    neutral_pct REAL NOT NULL,
    avg_rating REAL NOT NULL,
    quality_score REAL NOT NULL,
    value_score REAL NOT NULL,
    durability_score REAL NOT NULL,
    pros_json TEXT NOT NULL DEFAULT '[]',
    cons_json TEXT NOT NULL DEFAULT '[]',
    positive_feedback_json TEXT NOT NULL DEFAULT '[]',
    negative_feedback_json TEXT NOT NULL DEFAULT '[]',
    durability_insights TEXT NOT NULL,
    value_analysis TEXT NOT NULL,
    verified_vs_unverified_insights TEXT NOT NULL,
    confidence_level TEXT NOT NULL DEFAULT 'high',
    reviews_analyzed_count INTEGER NOT NULL DEFAULT 0,
    last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""

def ensure_database_initialized():
    from backend.database import get_connection
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.executescript(SCHEMA_SQL)
        conn.commit()

        # Check if users table is empty
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]

        if user_count == 0:
            print("[RealBuy Init] Seeding baseline demo personas & catalog...")
            pw_hash = hash_password("password123")
            demo_users = [
                ("u1", "alex_chen", "alex@realbuy.internal", "Alex Chen", "Tech Enthusiast & Audio Reviewer", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80", 1, 0, "user"),
                ("u2", "sarah_m", "sarah@realbuy.internal", "Sarah Miller", "Interior & Appliance Specialist", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80", 1, 0, "user"),
                ("u3", "david_k", "david@realbuy.internal", "David Kim", "Pro Gamer & Hardware Tester", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80", 1, 0, "user"),
                ("u4", "elena_r", "elena@realbuy.internal", "Elena Rostova", "Fitness Tracker & Wearables Expert", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80", 1, 0, "user"),
                ("u5", "marcus_v", "marcus@realbuy.internal", "Marcus Vance", "Audiophile & Espresso Brewer", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80", 1, 0, "user"),
                ("u_admin", "admin", "admin@realbuy.internal", "Admin Operator", "RealBuy Trust & Safety", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80", 1, 1, "admin")
            ]
            for u in demo_users:
                cursor.execute("""
                    INSERT OR IGNORE INTO users (id, username, email, password_hash, name, bio, avatar_url, is_verified, is_admin, role)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (u[0], u[1], u[2], pw_hash, u[3], u[4], u[5], u[6], u[7], u[8]))
            conn.commit()

        # Check if products table is empty
        cursor.execute("SELECT COUNT(*) FROM products")
        product_count = cursor.fetchone()[0]

        if product_count == 0:
            demo_products = [
                (
                    "p1", "WH-1000XM5 Wireless Headphones", "Sony", "WH1000XM5", "Electronics",
                    "Industry-leading noise canceling with two processors and 8 microphones for unprecedented noise cancellation.",
                    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
                    json.dumps([
                        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
                    ]),
                    "https://www.amazon.com/dp/B09XS7JWHH",
                    json.dumps([
                        {"title": "Amazon", "url": "https://www.amazon.com/dp/B09XS7JWHH"},
                        {"title": "Best Buy", "url": "https://www.bestbuy.com/site/sony-wh-1000xm5/6505727.p"},
                        {"title": "Sony Store", "url": "https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b"}
                    ]),
                    json.dumps({"Battery Life": "30 Hours", "Driver": "30mm", "Weight": "250g", "ANC": "Active Noise Canceling"})
                ),
                (
                    "p2", "MacBook Pro 16\" M3 Max", "Apple", "MUW63LL/A", "Laptops",
                    "The most advanced Mac laptop ever, engineered for grueling pro workflows.",
                    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
                    json.dumps([
                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
                    ]),
                    "https://www.apple.com/macbook-pro/",
                    json.dumps([
                        {"title": "Apple Store", "url": "https://www.apple.com/macbook-pro/"},
                        {"title": "Best Buy", "url": "https://www.bestbuy.com/site/apple-macbook-pro-16/6534617.p"},
                        {"title": "Amazon", "url": "https://www.amazon.com/dp/B0CM5N3T1L"}
                    ]),
                    json.dumps({"Chip": "Apple M3 Max 16-core", "RAM": "36GB Unified", "Display": "16.2 Liquid Retina XDR", "Battery": "Up to 22 hrs"})
                )
            ]
            for p in demo_products:
                cursor.execute("""
                    INSERT OR IGNORE INTO products (id, name, brand, model, category, description, thumbnail_url, images_json, product_url, store_links_json, specs_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, p)
            conn.commit()

            from backend.ai_engine import calculate_ai_product_analysis
            for p in demo_products:
                calculate_ai_product_analysis(p[0], conn)

        print("[RealBuy Init] Database verified and ready.")
    finally:
        conn.close()

if __name__ == "__main__":
    ensure_database_initialized()
