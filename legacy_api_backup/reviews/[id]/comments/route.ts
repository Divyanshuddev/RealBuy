import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const reviewId = params.id;
    const db = getDb();

    const comments = db.prepare(`
      SELECT c.id, c.review_id, c.user_id, c.content, c.created_at,
             u.username, u.name as user_name, u.avatar_url as user_avatar, u.is_verified as user_is_verified
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.review_id = ?
      ORDER BY c.created_at ASC
    `).all(reviewId) as any[];

    const replyStmt = db.prepare(`
      SELECT cr.id, cr.comment_id, cr.user_id, cr.content, cr.created_at,
             u.username, u.name as user_name, u.avatar_url as user_avatar, u.is_verified as user_is_verified
      FROM comment_replies cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.comment_id = ?
      ORDER BY cr.created_at ASC
    `);

    const commentsWithReplies = comments.map(c => ({
      id: c.id,
      review_id: c.review_id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      user: {
        id: c.user_id,
        username: c.username,
        name: c.user_name,
        avatar_url: c.user_avatar,
        is_verified: Boolean(c.user_is_verified),
      },
      replies: replyStmt.all(c.id).map((r: any) => ({
        id: r.id,
        comment_id: r.comment_id,
        user_id: r.user_id,
        content: r.content,
        created_at: r.created_at,
        user: {
          id: r.user_id,
          username: r.username,
          name: r.user_name,
          avatar_url: r.user_avatar,
          is_verified: Boolean(r.user_is_verified),
        }
      }))
    }));

    return NextResponse.json({ comments: commentsWithReplies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Please login to comment' }, { status: 401 });

    const { content } = await req.json();
    if (!content || !content.trim()) return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });

    const reviewId = params.id;
    const db = getDb();

    const review = db.prepare('SELECT user_id FROM product_reviews WHERE id = ?').get(reviewId) as any;
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const commentId = `c_${Date.now()}`;
    db.prepare(`
      INSERT INTO comments (id, review_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `).run(commentId, reviewId, user.id, content.trim());

    // Notify author if not self
    if (review.user_id !== user.id) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
        VALUES (?, ?, ?, 'comment', ?, ?)
      `).run(
        `n_${Date.now()}`, review.user_id, user.id, reviewId,
        `${user.name} commented on your review: "${content.trim().slice(0, 60)}..."`
      );
    }

    return NextResponse.json({
      comment: {
        id: commentId,
        review_id: reviewId,
        user_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar_url: user.avatar_url,
          is_verified: Boolean(user.is_verified),
        },
        replies: []
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
