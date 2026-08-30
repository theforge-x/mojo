import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const role = (await cookies()).get('mojo_role')?.value;
  const cancelledBy = role === 'tutor' ? 'tutor' : role === 'admin' ? 'admin' : 'student';

  try {
    await getHub().scheduling.cancel({
      sessionId: id,
      cancelledBy,
      withinNoticeWindow: body.withinNoticeWindow !== false,
      nowIso: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Cancellation failed.' },
      { status: 409 },
    );
  }
}
