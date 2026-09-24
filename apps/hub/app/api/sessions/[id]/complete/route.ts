import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { requireUser } from '../../../../../lib/session';

/**
 * Tutor-side lesson completion: the tutor confirms the lesson happened,
 * which completes delivery exactly like a student confirmation (wallet
 * credit + recap). Only the tutor on a `confirmed` booking may do this;
 * double completion is rejected by the booking domain.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  if (user.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 403 });
  }

  const { id } = await params;
  const hub = getHub();
  const session = (await hub.scheduling.sessionsByTutor(user.id)).find((s) => s.id === id);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You are not on this booking.' }, { status: 403 });
  }
  if (session.status !== 'confirmed') {
    return NextResponse.json(
      { ok: false, error: 'Only confirmed lessons can be completed.' },
      { status: 409 },
    );
  }

  try {
    await hub.booking.confirmDelivery({
      sessionId: id,
      confirmedBy: 'tutor',
      nowIso: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Completion failed.' },
      { status: 409 },
    );
  }
}
