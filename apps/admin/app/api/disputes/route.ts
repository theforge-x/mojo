import { NextResponse } from 'next/server';
import { getAdmin } from '../../../demo/composition-root';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const filedBy = body.filedBy === 'tutor' ? 'tutor' : 'student';
  const reason = typeof body.reason === 'string' ? body.reason : '';

  try {
    await getAdmin().disputes.file({ sessionId, filedBy, reason });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not file dispute.' },
      { status: 409 },
    );
  }
}
