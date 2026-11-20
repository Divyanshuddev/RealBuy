import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { username: string } }) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Please login to follow creators' }, { status: 401 });

    const targetUsername = params.username.toLowerCase();
    const db = getDb();

    const targetUser = db.prepare('SELECT id, name FROM users WHERE LOWER(username) = ?').get(targetUsername) as any;
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUser.id, targetUser.id);

    if (existing) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(currentUser.id, targetUser.id);
      const followersCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(targetUser.id) as any;
      return NextResponse.json({ following: false, followersCount: followersCount.c });
    } else {
      const id = `f_${Date.now()}`;
      db.prepare('INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)').run(id, currentUser.id, targetUser.id);

      db.prepare(`
        INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
        VALUES (?, ?, ?, 'follow', ?, ?)
      `).run(
        `n_${Date.now()}`, targetUser.id, currentUser.id, currentUser.id,
        `${currentUser.name} started following your reviews.`
      );

      const followersCount = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(targetUser.id) as any;
      return NextResponse.json({ following: true, followersCount: followersCount.c });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
