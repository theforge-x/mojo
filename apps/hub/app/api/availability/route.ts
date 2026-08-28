import { NextResponse } from 'next/server';
import { currentUser } from '../../../lib/session';
import { getHub } from '../../../demo/composition-root';

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rules = Array.isArray(body.rules) ? body.rules : [];

  try {
    await getHub().scheduling.saveAvailability(user.id, rules);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not save availability.' },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, count: rules.length });
}