import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { currentUser } from '../../../../lib/session';

export async function POST() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const result = await getHub().notifications.fireDueReminders(user.id, nowIso);
  return NextResponse.json({ ok: true, ...result, checkedAt: nowIso });
}
