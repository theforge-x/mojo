import { type NextRequest, NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';

export async function POST(request: NextRequest) {
  const hub = getHub();
  const token = request.cookies.get('mojo_user')?.value;
  const user = token ? await hub.identity.userByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign in to read messages.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const withId = typeof body.with === 'string' ? body.with : '';
  if (!withId) {
    return NextResponse.json({ ok: false, error: 'Missing partner id.' }, { status: 400 });
  }

  const thread = await hub.messaging.threadBetween(user.id, withId);
  const nowIso = new Date().toISOString();
  let read = 0;
  for (const message of thread) {
    if (message.recipientId === user.id && message.readAt === null) {
      await hub.messaging.markRead(message.id, nowIso);
      read += 1;
    }
  }

  return NextResponse.json({ ok: true, read });
}
