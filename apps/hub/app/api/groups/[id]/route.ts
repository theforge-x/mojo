import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { requireUser } from '../../../../lib/session';

/** One lab with its live seats and the current per-student group price. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const { id } = await params;
  const hub = getHub();
  const lab = await hub.groups.lab(id);
  if (!lab) {
    return NextResponse.json({ ok: false, error: 'Lab not found.' }, { status: 404 });
  }
  const members = await hub.groups.members(id);
  const active = members.filter((m) => m.status !== 'cancelled' && m.status !== 'no_show');
  const liveSize = active.length;
  const quote = await hub.billing
    .quote({
      tutorId: lab.tutorId,
      startIso: lab.startIso,
      endIso: lab.endIso,
      isTrial: false,
      groupSize: liveSize > 1 ? liveSize : undefined,
    })
    .catch(() => null);
  return NextResponse.json({
    ok: true,
    lab,
    seatsTaken: liveSize,
    seatsTotal: lab.maxSeats,
    joined: active.some((m) => m.studentId === user.id),
    perStudentMinor: quote?.totalMinor ?? null,
    perSegmentMinor: quote?.perSegmentMinor ?? null,
  });
}
