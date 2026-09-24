import { cookies, headers } from 'next/headers';
import { getHub } from '../demo/composition-root';

export interface CurrentUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: 'admin' | 'tutor' | 'student';
}

export function sessionCookieOptions(): {
  httpOnly: true;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
  secure: boolean;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  };
}

/**
 * Resolves the signed-in user from the session token issued by @mojo/identity
 * at sign-in/sign-up. Web callers carry it in the `mojo_user` httpOnly cookie;
 * programmatic callers (the future mobile client) send it as
 * `Authorization: Bearer <token>` instead — both resolve identically through
 * the application layer, never a raw store. The role always comes from the
 * stored user — the `mojo_role` cookie is treated as a UI hint only and never
 * trusted for authorization.
 */
export async function currentUser(): Promise<CurrentUser | null> {
  const [store, headerList] = await Promise.all([cookies(), headers()]);
  const authorization = headerList.get('authorization');
  const bearer =
    authorization?.startsWith('Bearer ') && authorization.length > 7
      ? authorization.slice(7).trim()
      : null;
  const token = bearer || store.get('mojo_user')?.value;
  if (!token) return null;

  const user = await getHub().identity.userByToken(token);
  if (!user) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** API-route guard — returns the user or null when unauthenticated. */
export async function requireUser(): Promise<CurrentUser | null> {
  return currentUser();
}

/** API-route guard — returns the user only when their DB role matches. */
export async function requireRole(...roles: CurrentUser['role'][]): Promise<CurrentUser | null> {
  const user = await currentUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}
