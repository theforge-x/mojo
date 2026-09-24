import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { authorizeWorker } from '../../../../lib/workers';

/**
 * Closes lessons stuck in `confirmed` past the auto-confirm window, releasing
 * tutor payouts and recaps without waiting on the student. Idempotent — safe
 * to schedule blindly. Triggered by cron (see vercel.json).
 */
export async function POST(request: Request) {
  const auth = await authorizeWorker(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await getHub().booking.autoConfirm(new Date().toISOString());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Auto-confirm failed.' },
      { status: 500 },
    );
  }
}
