import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Please login to reply' }, { status: 401 });

    const { content } = await req.json();
    if (!content || !content.trim()) return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });

    const commentId = params.id;
    const db = getDb();

    const comment = db.prepare('SELECT user_id, review_id FROM comments WHERE id = ?').get(commentId) as any;
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const replyId = `cr_${Date.now()}`;
    db.prepare(`
      INSERT INTO comment_replies (id, comment_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `).run(replyId, commentId, user.id, content.trim());

    // Notify comment author if not self
    if (comment.user_id !== user.id) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
        VALUES (?, ?, ?, 'reply', ?, ?)
      `).run(
        `n_${Date.now()}`, comment.user_id, user.id, comment.review_id,
        `${user.name} replied to your comment: "${content.trim().slice(0, 60)}..."`
      );
    }

    return NextResponse.json({
      reply: {
        id: replyId,
        comment_id: commentId,
        user_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar_url: user.avatar_url,
          is_verified: Boolean(user.is_verified),
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
