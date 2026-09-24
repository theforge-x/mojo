import { NextResponse } from 'next/server';
import { getAdmin } from '../../../demo/composition-root';
import { requireAdmin } from '../../../lib/session';

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
  }
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
