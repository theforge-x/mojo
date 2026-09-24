import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { requireRole } from '../../../lib/session';

/**
 * Student reviews unlock only after the session completes, one per session.
 */
export async function POST(request: Request) {
  const user = await requireRole('student');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Student sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const rating = typeof body.rating === 'number' ? body.rating : 0;
  const text = typeof body.body === 'string' ? body.body.trim() : '';

  if (!sessionId) {
    return NextResponse.json({ ok: false, error: 'Missing session.' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { ok: false, error: 'Rating must be between 1 and 5.' },
      { status: 422 },
    );
  }
  if (text.length === 0 || text.length > 2000) {
    return NextResponse.json(
      { ok: false, error: 'Write a review between 1 and 2000 characters.' },
      { status: 422 },
    );
  }

  const hub = getHub();
  const sessions = await hub.scheduling.sessionsByStudent(user.id);
  const session = sessions.find((s) => s.id === sessionId);
  if (!session || session.studentId !== user.id) {
    return NextResponse.json({ ok: false, error: 'You are not on this booking.' }, { status: 403 });
  }
  if (session.status !== 'completed') {
    return NextResponse.json(
      { ok: false, error: 'Reviews unlock after the session completes.' },
      { status: 409 },
    );
  }
  if (await hub.reviews.reviewForSession(sessionId)) {
    return NextResponse.json(
      { ok: false, error: 'This session already has a review.' },
      { status: 409 },
    );
  }

  await hub.reviews.submit({
    id: crypto.randomUUID(),
    sessionId,
    tutorId: session.tutorId,
    studentId: user.id,
    rating,
    body: text,
    flagged: false,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(request: Request) {
  const tutorId = new URL(request.url).searchParams.get('tutorId');
  if (!tutorId) {
    return NextResponse.json({ ok: false, error: 'Missing tutorId.' }, { status: 400 });
  }
  const reviews = await getHub().reviews.forTutor(tutorId);
  return NextResponse.json({ ok: true, reviews });
}
