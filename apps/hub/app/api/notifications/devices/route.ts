import { isExpoPushToken } from '@mojo/notifications/infrastructure';
import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { requireUser } from '../../../../lib/session';

const PLATFORMS = ['ios', 'android'] as const;

/**
 * Push-device registry — the mobile app registers its Expo push token here
 * after sign-in (and re-registers on token refresh), and unregisters on
 * sign-out. Lesson reminders addressed to the `push` channel resolve through
 * these tokens; users with no device simply receive no push.
 */
export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, devices: await getHub().notifications.devices(user.id) });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const platform = body.platform === 'ios' ? 'ios' : 'android';
  if (!isExpoPushToken(token)) {
    return NextResponse.json(
      { ok: false, error: 'A valid Expo push token is required.' },
      { status: 422 },
    );
  }
  await getHub().notifications.registerDevice({
    userId: user.id,
    token,
    platform: PLATFORMS.includes(body.platform) ? platform : 'android',
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token is required.' }, { status: 422 });
  }
  await getHub().notifications.removeDevice(user.id, token);
  return NextResponse.json({ ok: true });
}
