import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Please login to vote' }, { status: 401 });

    const reviewId = params.id;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM helpful_votes WHERE user_id = ? AND review_id = ?').get(user.id, reviewId);

    if (existing) {
      db.prepare('DELETE FROM helpful_votes WHERE user_id = ? AND review_id = ?').run(user.id, reviewId);
      db.prepare('UPDATE product_reviews SET helpful_count = MAX(0, helpful_count - 1) WHERE id = ?').run(reviewId);
      const updated = db.prepare('SELECT helpful_count FROM product_reviews WHERE id = ?').get(reviewId) as any;
      return NextResponse.json({ helpful: false, helpful_count: updated.helpful_count });
    } else {
      const id = `h_${Date.now()}`;
      db.prepare('INSERT INTO helpful_votes (id, user_id, review_id) VALUES (?, ?, ?)').run(id, user.id, reviewId);
      db.prepare('UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = ?').run(reviewId);
      const updated = db.prepare('SELECT helpful_count FROM product_reviews WHERE id = ?').get(reviewId) as any;
      return NextResponse.json({ helpful: true, helpful_count: updated.helpful_count });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
