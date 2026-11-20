import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import getDb from './db';
import { User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'realbuy_super_secret_jwt_key_2026';
const COOKIE_NAME = 'realbuy_token';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(user: { id: string; username: string; role: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): { id: string; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
  } catch (err) {
    return null;
  }
}

export function getCurrentUser(): User | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.id) return null;

    const db = getDb();
    const user = db.prepare(`
      SELECT 
        u.id, u.username, u.email, u.name, u.bio, u.avatar_url, u.is_verified, u.is_admin, u.role, u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id) as reviews_count,
        (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id AND is_verified_purchase = 1) as verified_reviews_count,
        COALESCE((SELECT SUM(helpful_count) FROM product_reviews WHERE user_id = u.id), 0) as avg_helpfulness
      FROM users u
      WHERE u.id = ?
    `).get(payload.id) as User | undefined;

    return user || null;
  } catch (err) {
    return null;
  }
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const user = db.prepare(`
    SELECT 
      u.id, u.username, u.email, u.name, u.bio, u.avatar_url, u.is_verified, u.is_admin, u.role, u.created_at,
      (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
      (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id) as reviews_count,
      (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id AND is_verified_purchase = 1) as verified_reviews_count,
      COALESCE((SELECT SUM(helpful_count) FROM product_reviews WHERE user_id = u.id), 0) as avg_helpfulness
    FROM users u
    WHERE u.id = ?
  `).get(id) as User | undefined;

  return user || null;
}

export function getUserByUsername(username: string): User | null {
  const db = getDb();
  const user = db.prepare(`
    SELECT 
      u.id, u.username, u.email, u.name, u.bio, u.avatar_url, u.is_verified, u.is_admin, u.role, u.created_at,
      (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
      (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id) as reviews_count,
      (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id AND is_verified_purchase = 1) as verified_reviews_count,
      COALESCE((SELECT SUM(helpful_count) FROM product_reviews WHERE user_id = u.id), 0) as avg_helpfulness
    FROM users u
    WHERE LOWER(u.username) = LOWER(?)
  `).get(username) as User | undefined;

  return user || null;
}
