import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { emailOrUsername, password } = await req.json();

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Please enter email/username and password.' }, { status: 400 });
    }

    const cleanInput = emailOrUsername.trim().toLowerCase();
    const db = getDb();

    const user = db.prepare(`
      SELECT id, username, email, password_hash, name, bio, avatar_url, is_verified, is_admin, role
      FROM users
      WHERE LOWER(email) = ? OR LOWER(username) = ?
    `).get(cleanInput, cleanInput) as any;

    if (!user || !comparePassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 });
    }

    const token = signToken({ id: user.id, username: user.username, role: user.role });

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified,
      is_admin: user.is_admin,
      role: user.role,
    };

    const res = NextResponse.json({ user: safeUser, message: 'Logged in successfully.' });
    res.cookies.set('realbuy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
