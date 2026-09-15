import { NextResponse } from 'next/server';
import { requireRole } from '../../../lib/session';
import { getHub } from '../../../demo/composition-root';

export async function POST(request: Request) {
  const user = await requireRole('student');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Student sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tutorId = typeof body.tutorId === 'string' ? body.tutorId : '';
  const startIso = typeof body.startIso === 'string' ? body.startIso : '';
  const endIso = typeof body.endIso === 'string' ? body.endIso : '';
  const isTrial = body.isTrial === true;

  try {
    const session = await getHub().scheduling.book({
      sessionId: crypto.randomUUID(),
      tutorId,
      studentId: user.id,
      startIso,
      endIso,
      isTrial,
      nowIso: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, session }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Booking failed.' },
      { status: 409 },
    );
  }
}
