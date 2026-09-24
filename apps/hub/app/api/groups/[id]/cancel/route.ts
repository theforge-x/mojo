import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { requireRole } from '../../../../../lib/session';

/**
 * Cancel an open lab — every member seat unwinds through the normal cancel
 * path, so paid seats refund in full and nothing survives a dead lab.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('tutor');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Tutor sign-in required.' }, { status: 401 });
  }
  const { id } = await params;
  const lab = await getHub().groups.lab(id);
  if (!lab) {
    return NextResponse.json({ ok: false, error: 'Lab not found.' }, { status: 404 });
  }
  if (lab.tutorId !== user.id) {
    return NextResponse.json({ ok: false, error: 'This is not your lab.' }, { status: 403 });
  }
  try {
    const result = await getHub().groups.cancel({ groupId: id, tutorId: user.id });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not cancel the lab.' },
      { status: 409 },
    );
  }
}
