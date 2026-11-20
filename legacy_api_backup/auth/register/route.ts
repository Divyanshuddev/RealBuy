import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, email, password, name } = await req.json();

    if (!username || !email || !password || !name) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const db = getDb();

    // Check existing
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'Username or email already in use.' }, { status: 400 });
    }

    const id = `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passHash = hashPassword(password);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`;

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, name, bio, avatar_url, is_verified, is_admin, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'user')
    `).run(id, cleanUsername, cleanEmail, passHash, name.trim(), '', avatarUrl);

    const user = { id, username: cleanUsername, role: 'user', name: name.trim(), email: cleanEmail, avatar_url: avatarUrl };
    const token = signToken(user);

    const res = NextResponse.json({ user, message: 'Account registered successfully.' });
    res.cookies.set('realbuy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
