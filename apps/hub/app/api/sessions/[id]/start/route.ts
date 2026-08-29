import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { currentUser } from '../../../../../lib/session';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || user.role !== 'tutor') {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await getHub().scheduling.confirmSession({
      sessionId: id,
      tutorId: user.id,
      nowIso: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not start session.' },
      { status: 409 },
    );
  }
}
