import {
  DuplicateChargeError,
  InvalidReplacementGrantError,
  NoPaymentMethodError,
  TrialAlreadyUsedError,
} from '@mojo/payments/application';
import type { ScheduledSession } from '@mojo/scheduling/domain';
import type { SessionSummary } from '@mojo/shared/api-contract';
import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { requireRole, requireUser } from '../../../lib/session';

/**
 * My sessions — the mobile home-screen contract. Role-aware: students get
 * their bookings, tutors their schedule. Summaries only (no status history),
 * newest-start first.
 */
export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  if (user.role !== 'student' && user.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Students and tutors only.' }, { status: 403 });
  }
  const hub = getHub();
  const sessions =
    user.role === 'student'
      ? await hub.scheduling.sessionsByStudent(user.id)
      : await hub.scheduling.sessionsByTutor(user.id);
  const summaries: SessionSummary[] = [...sessions]
    .sort((a, b) => (a.startIso < b.startIso ? -1 : 1))
    .map((session) => ({
      id: session.id,
      tutorId: session.tutorId,
      studentId: session.studentId,
      startIso: session.startIso,
      endIso: session.endIso,
      status: session.status,
      isTrial: session.isTrial,
      groupId: session.groupId,
    }));
  return NextResponse.json({ ok: true, sessions: summaries });
}

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
  const replacementGrantId =
    typeof body.replacementGrantId === 'string' ? body.replacementGrantId : undefined;
  const hub = getHub();
  const nowIso = new Date().toISOString();

  let session: ScheduledSession;
  try {
    session = await hub.scheduling.book({
      sessionId: crypto.randomUUID(),
      tutorId,
      studentId: user.id,
      startIso,
      endIso,
      isTrial,
      nowIso,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Booking failed.' },
      { status: 409 },
    );
  }

  // The booking holds the slot; the charge settles it. If charging fails the
  // slot is released again so an unpaid booking never lingers in the ledger.
  try {
    const method =
      (await hub.billing.defaultMethod(user.id)) ??
      (await hub.billing.provisionDemoMethod(user.id));
    const charge = await hub.billing.charge({
      studentId: user.id,
      tutorId,
      sessionId: session.id,
      startIso: session.startIso,
      endIso: session.endIso,
      isTrial,
      paymentMethodId: method.id,
      customerEmail: user.email,
      replacementGrantId,
      nowIso,
    });
    return NextResponse.json({ ok: true, session, charge }, { status: 201 });
  } catch (error) {
    await hub.scheduling
      .cancel({
        sessionId: session.id,
        cancelledBy: 'student',
        withinNoticeWindow: true,
        nowIso: new Date().toISOString(),
      })
      .catch(() => {});
    const status =
      error instanceof NoPaymentMethodError ||
      error instanceof TrialAlreadyUsedError ||
      error instanceof InvalidReplacementGrantError
        ? 402
        : 409;
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof DuplicateChargeError
            ? 'This slot was already booked — refresh and try again.'
            : error instanceof Error
              ? error.message
              : 'Payment failed.',
      },
      { status },
    );
  }
}
