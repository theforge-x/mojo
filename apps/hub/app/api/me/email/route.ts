import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { requireUser } from '../../../../lib/session';

/** Moves sign-in to a new email after re-verifying the password. */
export async function PUT(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email : '';
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  try {
    await getHub().identity.changeEmail({ userId: user.id, email, currentPassword });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not change email.';
    const status = message === 'Invalid email or password.' ? 401 : 422;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
