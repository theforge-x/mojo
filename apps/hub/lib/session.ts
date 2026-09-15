import { cookies } from 'next/headers';
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
 * Resolves the signed-in user from the session cookie (# token issued by
 * @mojo/identity and stored by /api/auth/login). Reads go through the
 * application layer at the composition root, never to a raw store.
 * The role always comes from the stored user — the `mojo_role` cookie is
 * treated as a UI hint only and never trusted for authorization.
 */
export async function currentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get('mojo_user')?.value;
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
