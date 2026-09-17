import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { requireUser } from '../../../lib/session';

/**
 * Files a dispute over one of the caller's own sessions. Only finished or
 * cancelled lessons can be disputed, and one session carries at most one
 * open dispute — resolution happens in the admin console.
 */
export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  if (user.role !== 'student' && user.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!sessionId || reason.length < 10) {
    return NextResponse.json(
      { ok: false, error: 'Tell us which session and describe the issue (10+ characters).' },
      { status: 422 },
    );
  }

  const hub = getHub();
  const mine =
    user.role === 'tutor'
      ? await hub.scheduling.sessionsByTutor(user.id)
      : await hub.scheduling.sessionsByStudent(user.id);
  const session = mine.find((s) => s.id === sessionId);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You are not on this booking.' }, { status: 403 });
  }
  if (session.status !== 'completed' && session.status !== 'cancelled') {
    return NextResponse.json(
      { ok: false, error: 'Only finished or cancelled lessons can be disputed.' },
      { status: 409 },
    );
  }
  const existing = await hub.trust.forSession(sessionId);
  if (existing && existing.status === 'open') {
    return NextResponse.json(
      { ok: false, error: 'This lesson already has an open dispute.' },
      { status: 409 },
    );
  }

  const dispute = await hub.trust.file({ sessionId, filedBy: user.role, reason });
  return NextResponse.json({ ok: true, dispute }, { status: 201 });
}
