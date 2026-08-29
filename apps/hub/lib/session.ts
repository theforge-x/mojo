import { cookies } from 'next/headers';
import { getHub } from '../demo/composition-root';

export interface CurrentUser {
  readonly id: string;
  readonly email: string;
  readonly role: 'admin' | 'tutor' | 'student';
}

/**
 * Resolves the signed-in user from the session cookie (# token issued by
 * @mojo/identity and stored by /api/auth/login). Reads go through the
 * application layer at the composition root, never to a raw store.
 */
export async function currentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get('mojo_user')?.value;
  if (!token) return null;

  const user = await getHub().identity.userByToken(token);
  if (!user) return null;

  const role = (store.get('mojo_role')?.value as CurrentUser['role'] | undefined) ?? user.role;
  return { id: user.id, email: user.email, role };
}