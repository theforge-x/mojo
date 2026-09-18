import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { requireRole } from '../../../../lib/session';

/**
 * Redirect checkout for students without a saved card: books the slot, opens
 * a Paystack transaction for it, and returns the authorization URL. The slot
 * is released again if anything fails, so an unpaid booking never lingers.
 */
export async function POST(request: Request) {
  const user = await requireRole('student');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Student sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tutorId = typeof body.tutorId === 'string' ? body.tutorId : '';
  const startIso = typeof body.startIso === 'string' ? body.startIso : '';
  const endIso = typeof body.endIso === 'string' ? body.endIso : '';
  const isTrial = body.isTrial === true;
  if (!tutorId || !startIso || !endIso) {
    return NextResponse.json(
      { ok: false, error: 'Pick a tutor and a time slot first.' },
      { status: 400 },
    );
  }

  const hub = getHub();
  const nowIso = new Date().toISOString();
  let sessionId: string | null = null;
  try {
    const session = await hub.scheduling.book({
      sessionId: crypto.randomUUID(),
      tutorId,
      studentId: user.id,
      startIso,
      endIso,
      isTrial,
      nowIso,
    });
    sessionId = session.id;
    const callbackUrl = `${new URL(request.url).origin}/payments/verify`;
    const { charge, authorizationUrl } = await hub.billing.initializeCharge({
      studentId: user.id,
      tutorId,
      sessionId: session.id,
      startIso: session.startIso,
      endIso: session.endIso,
      isTrial,
      customerEmail: user.email,
      callbackUrl,
      nowIso,
    });
    return NextResponse.json({ ok: true, session, charge, authorizationUrl }, { status: 201 });
  } catch (error) {
    if (sessionId) {
      await hub.scheduling
        .cancel({ sessionId, cancelledBy: 'student', withinNoticeWindow: true, nowIso })
        .catch(() => {});
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Payment failed.' },
      { status: 409 },
    );
  }
}
