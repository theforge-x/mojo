import { NextResponse } from 'next/server';
import { requireUser } from '../../../../../lib/session';
import { getHub } from '../../../../../demo/composition-root';

/**
 * Moves a booking to a new slot: books the new time first (so availability,
 * conflicts, buffer and notice are all re-validated) and cancels the old
 * one only after the new booking succeeds.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const startIso = typeof body.startIso === 'string' ? body.startIso : '';
  const endIso = typeof body.endIso === 'string' ? body.endIso : '';
  if (!startIso || !endIso) {
    return NextResponse.json({ ok: false, error: 'Pick a new start and end time.' }, { status: 400 });
  }

  const hub = getHub();
  const mine =
    user.role === 'tutor'
      ? await hub.scheduling.sessionsByTutor(user.id)
      : await hub.scheduling.sessionsByStudent(user.id);
  const session = mine.find((s) => s.id === id);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You are not on this booking.' }, { status: 403 });
  }
  if (session.status !== 'booked') {
    return NextResponse.json(
      { ok: false, error: 'Only booked sessions can be rescheduled.' },
      { status: 409 },
    );
  }

  const nowIso = new Date().toISOString();
  try {
    const moved = await hub.scheduling.book({
      sessionId: crypto.randomUUID(),
      tutorId: session.tutorId,
      studentId: session.studentId,
      startIso,
      endIso,
      isTrial: session.isTrial,
      nowIso,
    });
    await hub.scheduling.cancel({
      sessionId: id,
      cancelledBy: user.role === 'tutor' ? 'tutor' : 'student',
      withinNoticeWindow: true,
      nowIso,
    });
    return NextResponse.json({ ok: true, session: moved }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Reschedule failed.' },
      { status: 409 },
    );
  }
}
