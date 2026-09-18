import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { requireUser } from '../../../lib/session';

/**
 * Checkout breakdown for a slot: segments, standard total, trial discount,
 * and total — the same numbers `charge-student` settles, so the UI never
 * duplicates pricing math.
 */
export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const tutorId = params.get('tutorId') ?? '';
  const startIso = params.get('startIso') ?? '';
  const endIso = params.get('endIso') ?? '';
  const isTrial = params.get('isTrial') === 'true';
  const groupSizeRaw = Number(params.get('groupSize') ?? '');
  const groupSize = Number.isInteger(groupSizeRaw) && groupSizeRaw > 1 ? groupSizeRaw : undefined;
  if (!tutorId || !startIso || !endIso) {
    return NextResponse.json(
      { ok: false, error: 'tutorId, startIso and endIso are required.' },
      { status: 400 },
    );
  }
  try {
    const quote = await getHub().billing.quote({ tutorId, startIso, endIso, isTrial, groupSize });
    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not quote.' },
      { status: 422 },
    );
  }
}
