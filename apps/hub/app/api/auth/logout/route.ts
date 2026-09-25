import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revokeSessionToken } from '../../../../lib/credential-auth';

/**
 * Programmatic sign-out — revokes the session token server-side (Prisma
 * mode) and clears the cookies. Accepts the token from the `mojo_user`
 * cookie or an `Authorization: Bearer` header so mobile clients can log out
 * with the token they were issued at sign-in/sign-up.
 */
export async function POST(request: Request) {
  const header = request.headers.get('authorization');
  const bearer = header?.startsWith('Bearer ') && header.length > 7 ? header.slice(7).trim() : null;
  const token = bearer || (await cookies()).get('mojo_user')?.value || '';

  if (token) await revokeSessionToken(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('mojo_user');
  response.cookies.delete('mojo_role');
  return response;
}
