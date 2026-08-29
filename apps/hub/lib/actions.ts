'use server';

import { WeakPasswordError } from '@mojo/identity/application';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getHub } from '../demo/composition-root';

export async function loginWithDemo(input: {
  email: string;
  password: string;
}): Promise<{ redirectTo: string }> {
  const { token, role, user } = await getHub().identity.authenticate(input.email, input.password);

  const store = await cookies();
  store.set('mojo_user', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  store.set('mojo_role', role, { httpOnly: true, sameSite: 'lax', path: '/' });

  return { redirectTo: user.role === 'tutor' ? '/tutor' : '/' };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete('mojo_user');
  store.delete('mojo_role');
  redirect('/');
}

export async function signupWithDemo(input: {
  name: string;
  email: string;
  password: string;
  timezone: string;
  locale: string;
}): Promise<{ redirectTo: string } | { error: string }> {
  try {
    await getHub().identity.register({
      name: input.name,
      email: input.email,
      password: input.password,
      timezone: input.timezone,
      locale: input.locale,
    });

    const { token, role, user } = await getHub().identity.authenticate(input.email, input.password);
    const store = await cookies();
    store.set('mojo_user', token, { httpOnly: true, sameSite: 'lax', path: '/' });
    store.set('mojo_role', role, { httpOnly: true, sameSite: 'lax', path: '/' });

    return { redirectTo: user.role === 'tutor' ? '/tutor' : '/' };
  } catch (error) {
    if (error instanceof WeakPasswordError) {
      return { error: `Password too weak — ${error.reasons.join('; ')}.` };
    }
    return { error: error instanceof Error ? error.message : 'Could not create your account.' };
  }
}
