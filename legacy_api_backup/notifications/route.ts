import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) return NextResponse.json({ notifications: [] });

    const db = getDb();
    const notifications = db.prepare(`
      SELECT n.id, n.user_id, n.actor_id, n.type, n.entity_id, n.message, n.is_read, n.created_at,
             u.username as actor_username, u.name as actor_name, u.avatar_url as actor_avatar
      FROM notifications n
      LEFT JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 40
    `).all(user.id) as any[];

    const formatted = notifications.map(n => ({
      ...n,
      is_read: Boolean(n.is_read),
      actor: {
        id: n.actor_id,
        username: n.actor_username,
        name: n.actor_name,
        avatar_url: n.actor_avatar,
      }
    }));

    return NextResponse.json({ notifications: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notificationId } = await req.json();
    const db = getDb();

    if (notificationId === 'all') {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user.id);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notificationId, user.id);
    }

    return NextResponse.json({ message: 'Marked as read' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
