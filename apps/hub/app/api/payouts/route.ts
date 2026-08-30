import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { currentUser } from '../../../lib/session';

export async function POST(request: Request) {
  const user = await currentUser();
  if (user?.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const amountMinor = typeof body.amountMinor === 'number' ? body.amountMinor : 0;
  const currency = typeof body.currency === 'string' ? body.currency : 'NGN';

  try {
    await getHub().wallet.releasePayout({
      tutorId: user.id,
      amount: { currency, amountMinor },
      nowIso: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Payout failed.' },
      { status: 409 },
    );
  }
}
