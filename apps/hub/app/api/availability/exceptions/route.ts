import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { currentUser } from '../../../../lib/session';

export async function GET(request: Request) {
  const user = await currentUser();
  if (user?.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ ok: false, error: 'from/to date range required.' }, { status: 400 });
  }

  const exceptions = await getHub().scheduling.exceptions(user.id, from, to);
  return NextResponse.json({ ok: true, exceptions });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (user?.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const date: unknown = body.date;
  const exceptions: unknown = body.exceptions;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(exceptions)) {
    return NextResponse.json(
      { ok: false, error: 'date and exceptions[] required.' },
      { status: 400 },
    );
  }

  const normalized = exceptions.map((e) => ({
    kind: (e?.kind === 'extra' ? 'extra' : 'blocked') as 'blocked' | 'extra',
    startMinute: Number(e?.startMinute),
    endMinute: Number(e?.endMinute),
  }));

  try {
    await getHub().scheduling.saveExceptions(user.id, date, normalized);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not save exceptions.' },
      { status: 409 },
    );
  }
  const saved = await getHub().scheduling.exceptions(user.id, date, date);
  return NextResponse.json({ ok: true, exceptions: saved });
}
