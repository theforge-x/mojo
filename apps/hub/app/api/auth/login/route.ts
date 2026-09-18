import { NextResponse } from 'next/server';
import { authenticateCredentials } from '../../../../lib/credential-auth';
import { clientIp } from '../../../../lib/rate-limit';
import { sessionCookieOptions } from '../../../../lib/session';

/**
 * Programmatic sign-in — the mobile auth contract (web forms use the
 * `loginWithDemo` server action; both funnel through
 * `authenticateCredentials`). Returns the session token in the body for
 * clients that don't run a cookie jar, and also sets it as an httpOnly
 * cookie for browser callers. 429 when rate-limited, 401 on bad credentials.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  const result = await authenticateCredentials({ email, password, clientKey: clientIp(request) });
  if (!result.ok) {
    const status = result.error.startsWith('Too many attempts') ? 429 : 401;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  const { token, role, user } = result.account;
  const response = NextResponse.json({
    ok: true,
    role,
    user: { id: user.id, email: user.email, role },
    token,
  });

  const options = sessionCookieOptions();
  response.cookies.set('mojo_user', token, options);
  response.cookies.set('mojo_role', role, options);

  return response;
}
