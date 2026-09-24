import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { requireUser } from '../../../../lib/session';

/** Renames the signed-in user's display name. */
export async function PUT(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name : '';
  try {
    await getHub().identity.updateDisplayName(user.id, name);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not save name.' },
      { status: 422 },
    );
  }
}
