import { LiveKitLabProvider } from '@mojo/lab/infrastructure';
import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { requireUser } from '../../../../../lib/session';

/**
 * Programmatic lab access — the mobile video contract. Mints a short-lived
 * LiveKit token for one participant of a session they belong to and returns
 * the same `LabAccess` JSON the web lab pages consume (`roomName`,
 * `serverUrl`, `participantToken`, `expiresAt`). Group seats resolve to the
 * shared `mojo-lab-<group>` room, exactly like the web pages. 503 when
 * LiveKit isn't configured.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const { id } = await params;
  const hub = getHub();

  // A seat row owned by either side, or a lab owned by its tutor (tutors
  // hold no seat row of their own) — the same gates as the web lab pages.
  let roomKey: string | undefined;
  if (user.role === 'student') {
    const mine = await hub.scheduling.sessionsByStudent(user.id);
    const session = mine.find((s) => s.id === id);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'You are not on this booking.' }, { status: 403 });
    }
    roomKey = session.groupId ?? undefined;
  } else if (user.role === 'tutor') {
    const mine = await hub.scheduling.sessionsByTutor(user.id);
    const session = mine.find((s) => s.id === id);
    if (session) {
      roomKey = session.groupId ?? undefined;
    } else {
      const lab = await hub.groups.lab(id);
      if (!lab || lab.tutorId !== user.id) {
        return NextResponse.json(
          { ok: false, error: 'You are not on this booking.' },
          { status: 403 },
        );
      }
      roomKey = lab.id;
    }
  } else {
    return NextResponse.json({ ok: false, error: 'Tutors and students only.' }, { status: 403 });
  }

  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return NextResponse.json(
      { ok: false, error: 'Live video is not configured on this deployment.' },
      { status: 503 },
    );
  }

  const provider = new LiveKitLabProvider(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL);
  const access = await provider.createAccess({
    sessionId: id,
    participantId: user.id,
    participantName: user.email,
    roomKey,
  });
  return NextResponse.json({ ok: true, access });
}
