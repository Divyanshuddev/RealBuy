import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { username: string } }) {
  try {
    const db = getDb();
    const currentUser = getCurrentUser();
    const username = params.username.toLowerCase();

    const user = db.prepare(`
      SELECT 
        u.id, u.username, u.email, u.name, u.bio, u.avatar_url, u.is_verified, u.is_admin, u.role, u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id) as reviews_count,
        (SELECT COUNT(*) FROM product_reviews WHERE user_id = u.id AND is_verified_purchase = 1) as verified_reviews_count,
        COALESCE((SELECT SUM(helpful_count) FROM product_reviews WHERE user_id = u.id), 0) as avg_helpfulness
        ${currentUser ? `, EXISTS(SELECT 1 FROM follows WHERE follower_id = '${currentUser.id}' AND following_id = u.id) as is_following` : ', 0 as is_following'}
      FROM users u
      WHERE LOWER(u.username) = ?
    `).get(username) as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user reviews
    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name, p.brand as product_brand, p.category as product_category, p.thumbnail_url as product_thumbnail,
             (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE review_id = r.id) as comments_count
      FROM product_reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(user.id) as any[];

    const mediaStmt = db.prepare('SELECT id, review_id, media_type, url FROM review_media WHERE review_id = ?');
    const fullReviews = reviews.map(r => ({
      ...r,
      is_verified_purchase: Boolean(r.is_verified_purchase),
      product: {
        id: r.product_id,
        name: r.product_name,
        brand: r.product_brand,
        category: r.product_category,
        thumbnail_url: r.product_thumbnail
      },
      media: mediaStmt.all(r.id)
    }));

    // Fetch saved products if looking at self
    let savedProducts: any[] = [];
    if (currentUser && currentUser.id === user.id) {
      savedProducts = db.prepare(`
        SELECT p.*,
          (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = p.id) as avg_rating,
          (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count
        FROM saved_products sp
        JOIN products p ON sp.product_id = p.id
        WHERE sp.user_id = ?
        ORDER BY sp.created_at DESC
      `).all(user.id);
    }

    return NextResponse.json({
      user: {
        ...user,
        is_verified: Boolean(user.is_verified),
        is_admin: Boolean(user.is_admin),
        is_following: Boolean(user.is_following),
      },
      reviews: fullReviews,
      savedProducts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { username: string } }) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const username = params.username.toLowerCase();
    if (currentUser.username.toLowerCase() !== username && !currentUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, bio, avatar_url } = await req.json();
    const db = getDb();

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name), bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url)
      WHERE LOWER(username) = ?
    `).run(name?.trim() || null, bio?.trim() || null, avatar_url?.trim() || null, username);

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
