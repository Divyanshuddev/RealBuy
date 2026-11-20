// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'realbuy.db');

// Ensure data folder exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbInstance: any = null;

export function getDb(): any {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: any) {
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_created ON product_reviews(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_review ON comments(review_id);
    CREATE INDEX IF NOT EXISTS idx_likes_review ON likes(review_id);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_products(user_id);
  `);
}

export default getDb;
