import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { currentUser } from '../../../../lib/session';

export async function PUT(request: Request) {
  const user = await currentUser();
  if (user?.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  // Partial update — omitted fields keep their current values instead of
  // resetting to defaults (a bare `{minimumNoticeMinutes: 0}` must not wipe
  // the tutor's timezone or unpause bookings as a side effect).
  const current = await getHub().scheduling.settings(user.id);
  const patch = {
    timezone: typeof body.timezone === 'string' ? body.timezone : current.timezone,
    bufferMinutes: Number.isFinite(body.bufferMinutes)
      ? Number(body.bufferMinutes)
      : current.bufferMinutes,
    minimumNoticeMinutes: Number.isFinite(body.minimumNoticeMinutes)
      ? Number(body.minimumNoticeMinutes)
      : current.minimumNoticeMinutes,
    pausedForNewBookings:
      typeof body.pausedForNewBookings === 'boolean'
        ? body.pausedForNewBookings
        : current.pausedForNewBookings,
  };

  try {
    await getHub().scheduling.updateSettings({ tutorId: user.id, ...patch });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not save settings.' },
      { status: 400 },
    );
  }
  const settings = await getHub().scheduling.settings(user.id);
  return NextResponse.json({ ok: true, settings });
}
