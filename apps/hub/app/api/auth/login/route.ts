import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { checkRateLimit, clientIp } from '../../../../lib/rate-limit';
import { sessionCookieOptions } from '../../../../lib/session';

export async function POST(request: Request) {
  const limited = checkRateLimit(`login:${clientIp(request)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts — try again in ${limited.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

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

    const options = sessionCookieOptions();
    response.cookies.set('mojo_user', token, options);
    response.cookies.set('mojo_role', role, options);

    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Sign-in failed.' },
      { status: 401 },
    );
  }
}
