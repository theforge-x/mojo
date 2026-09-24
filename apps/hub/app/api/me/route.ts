import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { currentUser, requireUser } from '../../../lib/session';

/** Resolves the caller's DB-backed identity (used by the admin app login). */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user });
}

/**
 * Deactivates the account effective immediately (history is kept for audit
 * and refund integrity) and signs the browser out.
 */
export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  try {
    await getHub().identity.deactivateAccount({ userId: user.id, currentPassword });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete account.';
    const status = message === 'Invalid email or password.' ? 401 : 422;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('mojo_user');
  response.cookies.delete('mojo_role');
  return response;
}
