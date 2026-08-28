import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  try {
    const { token, role, user } = await getHub().identity.authenticate(email, password);

    const response = NextResponse.json({
      ok: true,
      role,
      user: { id: user.id, email: user.email, role },
    });

    response.cookies.set('mojo_user', token, { httpOnly: true, sameSite: 'lax', path: '/' });
    response.cookies.set('mojo_role', role, { httpOnly: true, sameSite: 'lax', path: '/' });

    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Sign-in failed.' },
      { status: 401 },
    );
  }
}