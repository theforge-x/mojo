'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticateCredentials, registerAccount, revokeSessionToken } from './credential-auth';
import { sessionCookieOptions } from './session';

async function actionIp(): Promise<string> {
  const forwarded = (await headers()).get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return 'unknown';
}

export async function loginWithDemo(input: {
  email: string;
  password: string;
}): Promise<{ redirectTo: string }> {
  const result = await authenticateCredentials({ ...input, clientKey: await actionIp() });
  if (!result.ok) throw new Error(result.error);
  const { token, role, user } = result.account;

  const store = await cookies();
  const options = sessionCookieOptions();
  store.set('mojo_user', token, options);
  store.set('mojo_role', role, options);

  return { redirectTo: user.role === 'admin' ? '/tutors' : user.role === 'tutor' ? '/tutor' : '/' };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get('mojo_user')?.value;
  // Revoke the DB-backed session in Prisma mode so the token can't be reused.
  if (token) await revokeSessionToken(token);
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
  subject?: string;
}): Promise<{ redirectTo: string } | { error: string }> {
  const { subject: subjectIntent, ...account } = input;
  const result = await registerAccount({ ...account, clientKey: await actionIp() });
  if (!result.ok) return { error: result.error };
  const { token, role, user } = result.account;

  const store = await cookies();
  const options = sessionCookieOptions();
  store.set('mojo_user', token, options);
  store.set('mojo_role', role, options);

  if (user.role === 'tutor') return { redirectTo: '/tutor' };
  // Carries the landing-page subject search into the first signed-in view,
  // where `/` feeds it to the tutor directory filter.
  const subject = (subjectIntent ?? '').trim().slice(0, 40);
  return { redirectTo: subject === '' ? '/' : `/?subject=${encodeURIComponent(subject)}` };
}
