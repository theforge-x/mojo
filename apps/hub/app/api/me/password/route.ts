import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { requireUser } from '../../../../lib/session';

/** Rotates the password after re-verifying the current one. */
export async function PUT(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  try {
    await getHub().identity.changePassword({ userId: user.id, currentPassword, newPassword });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not change password.';
    const status = message === 'Invalid email or password.' ? 401 : 422;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
