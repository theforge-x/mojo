import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { requireRole } from '../../../lib/session';

export async function GET() {
  const user = await requireRole('tutor');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }
  const subscription = await getHub().plus.subscription(user.id);
  const wallet = await getHub().wallet.forTutor(user.id);
  const transactions = await getHub().wallet.transactions(user.id);
  return NextResponse.json({
    ok: true,
    subscription,
    wallet: { balanceMinor: wallet.balance.amountMinor, currency: wallet.balance.currency },
    transactions: transactions.slice(0, 20).map((t) => ({
      id: t.id,
      kind: t.kind,
      amountMinor: t.amount.amountMinor,
      relatedSessionId: t.relatedSessionId,
      createdAt: t.createdAt,
    })),
  });
}

/**
 * Mojo+ membership and custom per-segment pricing. Custom rates apply to
 * future bookings through the shared rate reader — search results, tutor
 * pages, quotes, and charges all resolve through it — while past charges
 * never move.
 */
export async function POST(request: Request) {
  const user = await requireRole('tutor');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === 'string' ? body.action : '';
  const hub = getHub();
  try {
    if (action === 'subscribe') {
      await hub.plus.subscribe(user.id);
    } else if (action === 'cancel') {
      await hub.plus.cancel(user.id);
    } else if (action === 'set-rate') {
      const rateMinor = typeof body.rateMinor === 'number' ? body.rateMinor : Number.NaN;
      await hub.plus.setCustomRate(user.id, rateMinor);
    } else {
      return NextResponse.json(
        { ok: false, error: 'action must be subscribe, cancel or set-rate.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, subscription: await hub.plus.subscription(user.id) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Mojo+ update failed.' },
      { status: 409 },
    );
  }
}
