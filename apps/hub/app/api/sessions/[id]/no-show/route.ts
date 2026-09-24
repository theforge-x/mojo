import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { requireUser } from '../../../../../lib/session';

/** Tutor (or student) marks the other party as a no-show on their booking. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user || (user.role !== 'tutor' && user.role !== 'student')) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }

  const { id } = await params;
  const hub = getHub();
  const mine =
    user.role === 'tutor'
      ? await hub.scheduling.sessionsByTutor(user.id)
      : await hub.scheduling.sessionsByStudent(user.id);
  const session = mine.find((s) => s.id === id);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You are not on this booking.' }, { status: 403 });
  }
  if (session.status !== 'booked' && session.status !== 'confirmed') {
    return NextResponse.json(
      { ok: false, error: 'Only upcoming sessions can be marked as no-show.' },
      { status: 409 },
    );
  }

  try {
    await hub.booking.markNoShow(
      id,
      user.role === 'tutor' ? 'student' : 'tutor',
      new Date().toISOString(),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not record no-show.' },
      { status: 409 },
    );
  }
}
