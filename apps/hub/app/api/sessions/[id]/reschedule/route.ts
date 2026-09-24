import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { requireUser } from '../../../../../lib/session';

/**
 * Moves a booking to a new slot in place — same session id, so the original
 * charge still settles it and exactly one charge ever exists per session.
 * The new slot re-validates through the scheduling engine (notice,
 * availability, conflicts, buffer).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const startIso = typeof body.startIso === 'string' ? body.startIso : '';
  const endIso = typeof body.endIso === 'string' ? body.endIso : '';
  if (!startIso || !endIso) {
    return NextResponse.json(
      { ok: false, error: 'Pick a new start and end time.' },
      { status: 400 },
    );
  }

  const hub = getHub();
  const mine =
    user.role === 'tutor'
      ? await hub.scheduling.sessionsByTutor(user.id)
      : await hub.scheduling.sessionsByStudent(user.id);
  const session = mine.find((s) => s.id === id);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You are not on this booking.' }, { status: 403 });
  }

  try {
    const moved = await hub.scheduling.reschedule({
      sessionId: id,
      newStartIso: startIso,
      newEndIso: endIso,
      nowIso: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, session: moved });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Reschedule failed.' },
      { status: 409 },
    );
  }
}
