import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateAIProductAnalysis } from '@/lib/ai-engine';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const review = db.prepare(`
      SELECT r.*, u.username, u.name as user_name, u.avatar_url as user_avatar, u.is_verified as user_is_verified,
             p.name as product_name, p.brand as product_brand
      FROM product_reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.id = ?
    `).get(params.id) as any;

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const media = db.prepare('SELECT * FROM review_media WHERE review_id = ?').all(params.id);
    return NextResponse.json({ review: { ...review, media } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const existing = db.prepare('SELECT * FROM product_reviews WHERE id = ?').get(params.id) as any;
    if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    if (existing.user_id !== user.id && !user.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, content, rating, quality_rating, value_rating, durability_rating } = await req.json();

    db.prepare(`
      UPDATE product_reviews
      SET title = ?, content = ?, rating = ?, quality_rating = ?, value_rating = ?, durability_rating = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || existing.title,
      content || existing.content,
      rating || existing.rating,
      quality_rating || existing.quality_rating,
      value_rating || existing.value_rating,
      durability_rating || existing.durability_rating,
      params.id
    );

    calculateAIProductAnalysis(existing.product_id);
    return NextResponse.json({ message: 'Review updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const existing = db.prepare('SELECT * FROM product_reviews WHERE id = ?').get(params.id) as any;
    if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    if (existing.user_id !== user.id && !user.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM product_reviews WHERE id = ?').run(params.id);
    calculateAIProductAnalysis(existing.product_id);

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
