import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { currentUser } from '../../../../lib/session';

export async function PUT(request: Request) {
  const user = await currentUser();
  if (user?.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const patch: {
    timezone: string;
    bufferMinutes: number;
    minimumNoticeMinutes: number;
    pausedForNewBookings: boolean;
  } = {
    timezone: typeof body.timezone === 'string' ? body.timezone : '',
    bufferMinutes: Number.isFinite(body.bufferMinutes) ? Number(body.bufferMinutes) : 15,
    minimumNoticeMinutes: Number.isFinite(body.minimumNoticeMinutes)
      ? Number(body.minimumNoticeMinutes)
      : 30,
    pausedForNewBookings:
      typeof body.pausedForNewBookings === 'boolean' ? body.pausedForNewBookings : false,
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
