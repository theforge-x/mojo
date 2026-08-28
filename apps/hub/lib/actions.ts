'use server';

import { cookies } from 'next/headers';
import { getHub } from '../demo/composition-root';

export async function loginWithDemo(input: {
  email: string;
  password: string;
}): Promise<{ redirectTo: string }> {
  const { token, role, user } = await getHub().identity.authenticate(input.email, input.password);

  const store = await cookies();
  store.set('mojo_user', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  store.set('mojo_role', role, { httpOnly: true, sameSite: 'lax', path: '/' });

  return { redirectTo: user.role === 'tutor' ? '/tutor/home' : '/student/home' };
}