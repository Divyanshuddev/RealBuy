import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Please login to like reviews' }, { status: 401 });

    const reviewId = params.id;
    const db = getDb();

    const review = db.prepare('SELECT user_id, product_id FROM product_reviews WHERE id = ?').get(reviewId) as any;
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND review_id = ?').get(user.id, reviewId);

    if (existing) {
      db.prepare('DELETE FROM likes WHERE user_id = ? AND review_id = ?').run(user.id, reviewId);
      const likesCount = db.prepare('SELECT COUNT(*) as c FROM likes WHERE review_id = ?').get(reviewId) as any;
      return NextResponse.json({ liked: false, likesCount: likesCount.c });
    } else {
      const id = `l_${Date.now()}`;
      db.prepare('INSERT INTO likes (id, user_id, review_id) VALUES (?, ?, ?)').run(id, user.id, reviewId);

      // Create notification for review author if not self
      if (review.user_id !== user.id) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
          VALUES (?, ?, ?, 'like', ?, ?)
        `).run(
          `n_${Date.now()}`, review.user_id, user.id, reviewId,
          `${user.name} liked your product review`
        );
      }

      const likesCount = db.prepare('SELECT COUNT(*) as c FROM likes WHERE review_id = ?').get(reviewId) as any;
      return NextResponse.json({ liked: true, likesCount: likesCount.c });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
