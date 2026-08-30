import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { currentUser } from '../../../../lib/session';

const CHANNELS = ['email', 'whatsapp'] as const;

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const preferences = await getHub().notifications.preferences(user.id);
  return NextResponse.json({ ok: true, preferences });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const current = await getHub().notifications.preferences(user.id);
  const channels = Array.isArray(body.channels)
    ? CHANNELS.filter((channel) => body.channels.includes(channel))
    : current.channels;
  const preferences = {
    lessonReminders:
      typeof body.lessonReminders === 'boolean' ? body.lessonReminders : current.lessonReminders,
    recapEmails: typeof body.recapEmails === 'boolean' ? body.recapEmails : current.recapEmails,
    marketing: typeof body.marketing === 'boolean' ? body.marketing : current.marketing,
    channels,
  };

  await getHub().notifications.savePreferences(user.id, preferences);
  return NextResponse.json({ ok: true, preferences });
}
