import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { authorizeWorker } from '../../../../lib/workers';

/**
 * Sweeps every active student for due lesson reminders (day-before + T-30
 * leads). Already-sent leads are journaled, so re-runs never double-notify.
 * Triggered by cron (see vercel.json).
 */
export async function POST(request: Request) {
  const auth = await authorizeWorker(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await getHub().notifications.fireAllDueReminders(new Date().toISOString());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Reminder sweep failed.' },
      { status: 500 },
    );
  }
}
