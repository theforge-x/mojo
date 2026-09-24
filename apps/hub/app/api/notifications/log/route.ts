import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { requireUser } from '../../../../lib/session';

/** Demo delivery journal — what the sweep recorded, per channel. */
export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, notifications: getHub().notifications.log() });
}
