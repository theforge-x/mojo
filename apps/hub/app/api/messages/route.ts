import { type NextRequest, NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';

const MAX_BODY_LENGTH = 2000;

function userFromRequest(
  hub: ReturnType<typeof getHub>,
  request: NextRequest,
): Promise<{ id: string; role: 'admin' | 'tutor' | 'student' } | null> {
  const token = request.cookies.get('mojo_user')?.value;
  if (!token) return Promise.resolve(null);
  return hub.identity
    .userByToken(token)
    .then((user) => (user ? { id: user.id, role: user.role } : null));
}

export async function GET(request: NextRequest) {
  const hub = getHub();
  const user = await userFromRequest(hub, request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign in to read messages.' }, { status: 401 });
  }

  const withId = request.nextUrl.searchParams.get('with');
  if (!withId) {
    return NextResponse.json({ ok: false, error: 'Missing partner id.' }, { status: 400 });
  }

  const thread = await hub.messaging.threadBetween(user.id, withId);
  return NextResponse.json({ ok: true, messages: thread });
}

export async function POST(request: NextRequest) {
  const hub = getHub();
  const user = await userFromRequest(hub, request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign in to send a message.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const recipientId = typeof body.recipientId === 'string' ? body.recipientId.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';

  if (!recipientId) {
    return NextResponse.json({ ok: false, error: 'Pick who you are messaging.' }, { status: 422 });
  }
  if (text.length === 0) {
    return NextResponse.json({ ok: false, error: 'Write a message first.' }, { status: 422 });
  }
  if (text.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Keep messages under ${MAX_BODY_LENGTH} characters.` },
      { status: 422 },
    );
  }

  if (user.role === 'student') {
    const tutor = await hub.profile.byTutor(recipientId);
    if (!tutor) {
      return NextResponse.json(
        { ok: false, error: 'That tutor does not exist yet.' },
        { status: 404 },
      );
    }
  }

  if (user.role === 'tutor') {
    const interested = await hub.interests.forTutor(user.id);
    const hasInterest = interested.some((i) => i.studentId === recipientId);
    const sessions = await hub.scheduling.sessionsByTutor(user.id);
    const hasSession = sessions.some((s) => s.studentId === recipientId);
    if (!hasInterest && !hasSession) {
      return NextResponse.json(
        {
          ok: false,
          error: 'You can only message a student after they have reached out or booked with you.',
        },
        { status: 403 },
      );
    }
  }

  if (user.role === 'admin') {
    return NextResponse.json({ ok: false, error: 'Admins cannot send messages.' }, { status: 403 });
  }

  const message = {
    id: crypto.randomUUID(),
    senderId: user.id,
    recipientId,
    body: text,
    sentAt: new Date().toISOString(),
    readAt: null,
  };
  await hub.messaging.send(message);

  return NextResponse.json({ ok: true, message }, { status: 201 });
}
