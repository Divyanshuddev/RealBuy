import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT id, username, email, name, bio, avatar_url, is_verified, is_admin, role
      FROM users
      WHERE LOWER(username) = ?
    `).get(username.toLowerCase()) as any;

    if (!user) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
    }

    const token = signToken({ id: user.id, username: user.username, role: user.role });
    const res = NextResponse.json({ user, message: `Switched to demo account: ${user.name}` });
    res.cookies.set('realbuy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
