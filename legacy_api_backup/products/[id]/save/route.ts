import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please login to save products' }, { status: 401 });
    }

    const productId = params.id;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM saved_products WHERE user_id = ? AND product_id = ?').get(user.id, productId);

    if (existing) {
      db.prepare('DELETE FROM saved_products WHERE user_id = ? AND product_id = ?').run(user.id, productId);
      return NextResponse.json({ saved: false, message: 'Removed from saved collection' });
    } else {
      const id = `s_${Date.now()}`;
      db.prepare('INSERT INTO saved_products (id, user_id, product_id) VALUES (?, ?, ?)').run(id, user.id, productId);
      return NextResponse.json({ saved: true, message: 'Saved to collection' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
