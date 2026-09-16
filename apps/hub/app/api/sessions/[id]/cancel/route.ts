import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { requireUser } from '../../../../../lib/session';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }

  const { id } = await params;
  const hub = getHub();
  const body = await request.json().catch(() => ({}));

  // Derive the actor from the DB-backed session — never the raw cookie.
  // Admins may act across bookings; students/tutors only on their own.
  if (user.role !== 'admin') {
    const mine =
      user.role === 'tutor'
        ? await hub.scheduling.sessionsByTutor(user.id)
        : await hub.scheduling.sessionsByStudent(user.id);
    if (!mine.some((s) => s.id === id)) {
      return NextResponse.json(
        { ok: false, error: 'You are not on this booking.' },
        { status: 403 },
      );
    }
  }
  const cancelledBy = user.role === 'tutor' ? 'tutor' : user.role === 'admin' ? 'admin' : 'student';

  try {
    await hub.scheduling.cancel({
      sessionId: id,
      cancelledBy,
      withinNoticeWindow: body.withinNoticeWindow !== false,
      nowIso: new Date().toISOString(),
    });
    // A cancelled booking keeps no money: settle the student's charge back
    // in full. Refund failure must not fail the cancellation itself.
    await hub.billing.refundForSession(id, 'cancelled', new Date().toISOString()).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Cancellation failed.' },
      { status: 409 },
    );
  }
}
