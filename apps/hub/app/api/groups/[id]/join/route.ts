import {
  DuplicateChargeError,
  GroupTrialBookingError,
  InvalidReplacementGrantError,
  NoPaymentMethodError,
  TrialAlreadyUsedError,
} from '@mojo/payments/application';
import type { ScheduledSession } from '@mojo/scheduling/domain';
import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { requireRole } from '../../../../../lib/session';

/**
 * Enroll into an open lab: books the student's seat at the live ladder size
 * and charges the per-student group price. A failed charge releases the seat
 * again, mirroring the one-on-one booking route.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('student');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Student sign-in required.' }, { status: 401 });
  }
  const { id } = await params;
  const hub = getHub();
  const nowIso = new Date().toISOString();

  const lab = await hub.groups.lab(id);
  if (!lab) {
    return NextResponse.json({ ok: false, error: 'Lab not found.' }, { status: 404 });
  }
  if (lab.status !== 'open') {
    return NextResponse.json(
      { ok: false, error: `This lab is ${lab.status} — enrollment is closed.` },
      { status: 409 },
    );
  }
  const members = await hub.groups.members(id);
  const active = members.filter((m) => m.status !== 'cancelled' && m.status !== 'no_show');
  if (active.length >= lab.maxSeats) {
    return NextResponse.json({ ok: false, error: 'This lab is full.' }, { status: 409 });
  }
  if (active.some((m) => m.studentId === user.id)) {
    return NextResponse.json({ ok: false, error: 'You already hold a seat in this lab.' }, { status: 409 });
  }
  const liveSize = active.length + 1;

  let session: ScheduledSession;
  try {
    session = await hub.scheduling.book({
      sessionId: crypto.randomUUID(),
      tutorId: lab.tutorId,
      studentId: user.id,
      startIso: lab.startIso,
      endIso: lab.endIso,
      isTrial: false,
      groupId: lab.id,
      groupSize: liveSize,
      nowIso,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Enrollment failed.' },
      { status: 409 },
    );
  }

  try {
    const method =
      (await hub.billing.defaultMethod(user.id)) ??
      (await hub.billing.provisionDemoMethod(user.id));
    const charge = await hub.billing.charge({
      studentId: user.id,
      tutorId: lab.tutorId,
      sessionId: session.id,
      startIso: session.startIso,
      endIso: session.endIso,
      isTrial: false,
      groupSize: liveSize,
      paymentMethodId: method.id,
      customerEmail: user.email,
      nowIso,
    });
    return NextResponse.json({ ok: true, session, charge, liveSize }, { status: 201 });
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
      error instanceof InvalidReplacementGrantError ||
      error instanceof GroupTrialBookingError ||
      error instanceof DuplicateChargeError
        ? 402
        : 409;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Payment failed.' },
      { status },
    );
  }
}
