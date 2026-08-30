import { NextResponse } from 'next/server';
import { getAdmin } from '../../../demo/composition-root';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === 'string' ? body.key : '';
  const enabled = body.enabled === true;
  const rolloutPercent = typeof body.rolloutPercent === 'number' ? body.rolloutPercent : 100;

  try {
    await getAdmin().config.setFlag({ key, enabled, rolloutPercent });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not update flag.' },
      { status: 409 },
    );
  }
}
