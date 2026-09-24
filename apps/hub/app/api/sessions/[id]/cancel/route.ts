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

  const cancelled = await hub.scheduling.sessionById(id);

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
    // A cancelled trial banks one free rebook with the same tutor. The grant
    // is single-use and can never mint a follow-up, so the chain terminates.
    let replacementGrantId: string | null = null;
    if (cancelled?.isTrial) {
      const grant = await hub.billing
        .grantReplacement({
          studentId: cancelled.studentId,
          tutorId: cancelled.tutorId,
          sourceSessionId: id,
        })
        .catch(() => null);
      if (grant !== null && grant.status === 'granted') replacementGrantId = grant.id;
    }
    return NextResponse.json({
      ok: true,
      replacementGranted: replacementGrantId !== null,
      replacementGrantId,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Cancellation failed.' },
      { status: 409 },
    );
  }
}
