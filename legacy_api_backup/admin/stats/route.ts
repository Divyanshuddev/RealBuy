import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user || (!user.is_admin && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const db = getDb();

    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get() as any;
    const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get() as any;
    const totalReviews = db.prepare('SELECT COUNT(*) as c FROM product_reviews').get() as any;
    const totalVerifiedReviews = db.prepare('SELECT COUNT(*) as c FROM product_reviews WHERE is_verified_purchase = 1').get() as any;
    const totalMedia = db.prepare('SELECT COUNT(*) as c FROM review_media').get() as any;
    const pendingReports = db.prepare('SELECT COUNT(*) as c FROM reports WHERE status = "pending"').get() as any;
    const pendingVerifications = db.prepare('SELECT COUNT(*) as c FROM purchase_verifications WHERE status = "pending"').get() as any;
    const aiAnalysesCount = db.prepare('SELECT COUNT(*) as c FROM ai_product_analyses').get() as any;

    const recentUsers = db.prepare('SELECT id, username, email, name, avatar_url, is_verified, role, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();
    const recentReviews = db.prepare(`
      SELECT r.id, r.title, r.rating, r.is_verified_purchase, r.created_at, u.name as user_name, p.name as product_name
      FROM product_reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `).all();

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers.c,
        totalProducts: totalProducts.c,
        totalReviews: totalReviews.c,
        totalVerifiedReviews: totalVerifiedReviews.c,
        totalMedia: totalMedia.c,
        pendingReports: pendingReports.c,
        pendingVerifications: pendingVerifications.c,
        aiAnalysesCount: aiAnalysesCount.c,
      },
      recentUsers,
      recentReviews,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
