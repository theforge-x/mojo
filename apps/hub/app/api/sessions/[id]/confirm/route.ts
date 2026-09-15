import { NextResponse } from 'next/server';
import { requireUser } from '../../../../../lib/session';
import { getHub } from '../../../../../demo/composition-root';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }

  const { id } = await params;
  const hub = getHub();

  // Only the student on the booking can confirm delivery — the
  // `confirmedBy: 'student'` below is an audit label, not the auth check.
  const [asStudent, asTutor] = await Promise.all([
    hub.scheduling.sessionsByStudent(user.id),
    user.role === 'tutor' ? hub.scheduling.sessionsByTutor(user.id) : Promise.resolve([]),
  ]);
  const session = [...asStudent, ...asTutor].find((s) => s.id === id);
  if (!session || session.studentId !== user.id) {
    return NextResponse.json(
      { ok: false, error: 'Only the student on this booking can confirm delivery.' },
      { status: 403 },
    );
  }

  try {
    await getHub().booking.confirmDelivery({
      sessionId: id,
      confirmedBy: 'student',
      nowIso: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Confirmation failed.' },
      { status: 409 },
    );
  }
}
