import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { requireRole, requireUser } from '../../../lib/session';

/**
 * Group labs: a tutor opens a seat-limited event inside their availability;
 * students enroll into it and everyone shares one lab room. Prices follow
 * the group ladder — the per-student rate drops as seats fill.
 */
export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const hub = getHub();
  // A tutor's own dashboard lists everything; anyone else sees open labs.
  if (params.get('mine') === 'true') {
    if (user.role !== 'tutor') {
      return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 403 });
    }
    return NextResponse.json({ ok: true, labs: await hub.groups.labsByTutor(user.id) });
  }
  const tutorId = params.get('tutorId') ?? '';
  if (!tutorId) {
    return NextResponse.json({ ok: false, error: 'tutorId is required.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, labs: await hub.groups.openLabs(tutorId) });
}

export async function POST(request: Request) {
  const user = await requireRole('tutor');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title : '';
  const startIso = typeof body.startIso === 'string' ? body.startIso : '';
  const endIso = typeof body.endIso === 'string' ? body.endIso : '';
  const maxSeats = typeof body.maxSeats === 'number' ? body.maxSeats : 0;
  try {
    const lab = await getHub().groups.create({
      tutorId: user.id,
      title,
      startIso,
      endIso,
      maxSeats,
    });
    return NextResponse.json({ ok: true, lab }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not open the lab.' },
      { status: 409 },
    );
  }
}
