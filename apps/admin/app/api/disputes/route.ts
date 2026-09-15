import { NextResponse } from 'next/server';
import { getAdmin } from '../../../demo/composition-root';
import { requireAdmin } from '../../../lib/session';

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const filedBy = body.filedBy === 'tutor' ? 'tutor' : 'student';
  const reason = typeof body.reason === 'string' ? body.reason : '';

  try {
    await getAdmin().disputes.file({ sessionId, filedBy, reason });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not file dispute.' },
      { status: 409 },
    );
  }
}
