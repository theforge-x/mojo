import { ChargeNotFoundError } from '@mojo/payments/application';
import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { requireRole } from '../../../../../lib/session';

/**
 * Student-initiated refund for one of their charges. Policy: the session
 * must already be cancelled — active bookings keep their charge, and
 * disputed or no-show sessions settle through the admin dispute flow.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('student');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Student sign-in required.' }, { status: 401 });
  }

  const { id } = await params;
  const hub = getHub();
  const charges = await hub.billing.chargesByStudent(user.id);
  const charge = charges.find((c) => c.id === id);
  if (!charge) {
    return NextResponse.json(
      { ok: false, error: new ChargeNotFoundError().message },
      { status: 404 },
    );
  }
  if (charge.status === 'refunded') {
    return NextResponse.json(
      { ok: false, error: 'This charge was already refunded.' },
      { status: 409 },
    );
  }

  const sessions = await hub.scheduling.sessionsByStudent(user.id);
  const session = sessions.find((s) => s.id === charge.sessionId);
  if (session?.status !== 'cancelled') {
    return NextResponse.json(
      { ok: false, error: 'Only cancelled sessions can be refunded here.' },
      { status: 409 },
    );
  }

  try {
    const { refund, charge: updated } = await hub.billing.refund({
      chargeId: charge.id,
      studentId: user.id,
      reason: 'cancelled',
      nowIso: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, refund, charge: updated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Refund failed.' },
      { status: 409 },
    );
  }
}
