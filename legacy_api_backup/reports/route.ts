import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Please login to submit a report' }, { status: 401 });

    const { target_type, target_id, reason, description } = await req.json();

    if (!target_type || !target_id || !reason) {
      return NextResponse.json({ error: 'Missing required report fields' }, { status: 400 });
    }

    const db = getDb();
    const id = `rep_${Date.now()}`;

    db.prepare(`
      INSERT INTO reports (id, reporter_id, target_type, target_id, reason, description, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, user.id, target_type, target_id, reason, description?.trim() || '');

    return NextResponse.json({
      message: 'Thank you. Your report has been submitted to the moderation team for review.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
