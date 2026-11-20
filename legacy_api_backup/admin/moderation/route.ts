import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateAIProductAnalysis } from '@/lib/ai-engine';

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user || (!user.is_admin && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const db = getDb();

    const reports = db.prepare(`
      SELECT rep.*, u.name as reporter_name, u.username as reporter_username
      FROM reports rep
      JOIN users u ON rep.reporter_id = u.id
      ORDER BY rep.created_at DESC
      LIMIT 50
    `).all();

    const verifications = db.prepare(`
      SELECT pv.*, u.name as user_name, u.username, r.title as review_title, p.name as product_name, p.id as product_id
      FROM purchase_verifications pv
      JOIN users u ON pv.user_id = u.id
      JOIN product_reviews r ON pv.review_id = r.id
      JOIN products p ON r.product_id = p.id
      ORDER BY pv.created_at DESC
      LIMIT 50
    `).all();

    return NextResponse.json({ reports, verifications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getCurrentUser();
    if (!user || (!user.is_admin && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, id, status, notes, reviewId, productId } = await req.json();
    const db = getDb();

    if (action === 'resolve_report') {
      db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status || 'resolved', id);
      return NextResponse.json({ message: 'Report status updated' });
    }

    if (action === 'delete_reported_review') {
      const review = db.prepare('SELECT product_id FROM product_reviews WHERE id = ?').get(reviewId) as any;
      db.prepare('DELETE FROM product_reviews WHERE id = ?').run(reviewId);
      db.prepare('UPDATE reports SET status = "resolved" WHERE target_id = ?').run(reviewId);
      if (review) calculateAIProductAnalysis(review.product_id);
      return NextResponse.json({ message: 'Reported review removed' });
    }

    if (action === 'verify_purchase') {
      db.prepare('UPDATE purchase_verifications SET status = ?, reviewed_by = ?, notes = ? WHERE id = ?').run(
        status, user.name, notes || '', id
      );

      const isApproved = status === 'verified';
      db.prepare('UPDATE product_reviews SET is_verified_purchase = ?, verification_status = ? WHERE id = ?').run(
        isApproved ? 1 : 0, status, reviewId
      );

      const review = db.prepare('SELECT user_id, product_id FROM product_reviews WHERE id = ?').get(reviewId) as any;
      if (review) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
          VALUES (?, ?, ?, 'verified_purchase', ?, ?)
        `).run(
          `n_${Date.now()}`, review.user_id, user.id, reviewId,
          isApproved
            ? 'Your purchase invoice was verified! Your review now displays the official Verified Buyer badge.'
            : 'Your purchase verification was reviewed and not approved.'
        );
        calculateAIProductAnalysis(review.product_id);
      }

      return NextResponse.json({ message: `Verification status updated to ${status}` });
    }

    if (action === 'recalculate_all_ai') {
      const products = db.prepare('SELECT id FROM products').all() as any[];
      for (const p of products) {
        try {
          calculateAIProductAnalysis(p.id);
        } catch (e) {}
      }
      return NextResponse.json({ message: `Successfully recalculated AI intelligence reports for ${products.length} products.` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
