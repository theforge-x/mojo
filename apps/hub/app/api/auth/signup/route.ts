import { NextResponse } from 'next/server';
import { registerAccount } from '../../../../lib/credential-auth';
import { clientIp } from '../../../../lib/rate-limit';
import { sessionCookieOptions } from '../../../../lib/session';

/**
 * Programmatic sign-up — the mobile registration contract (web forms use
 * the `signupWithDemo` server action; both funnel through
 * `registerAccount`). Registers as a student, signs straight in, and returns
 * the session token in the body for clients without a cookie jar (browsers
 * also get the httpOnly cookies). 429 when rate-limited, 422 otherwise.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const timezone = typeof body.timezone === 'string' ? body.timezone : 'UTC';
  const locale = typeof body.locale === 'string' ? body.locale : 'en';
  if (!name || !email || !password) {
    return NextResponse.json(
      { ok: false, error: 'Name, email and password are required.' },
      { status: 422 },
    );
  }

  const result = await registerAccount({
    name,
    email,
    password,
    timezone,
    locale,
    clientKey: clientIp(request),
  });
  if (!result.ok) {
    const status = result.error.startsWith('Too many attempts') ? 429 : 422;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  const { token, role, user } = result.account;
  const response = NextResponse.json(
    {
      ok: true,
      role,
      user: { id: user.id, email: user.email, role },
      token,
    },
    { status: 201 },
  );

  const options = sessionCookieOptions();
  response.cookies.set('mojo_user', token, options);
  response.cookies.set('mojo_role', role, options);

  return response;
}
