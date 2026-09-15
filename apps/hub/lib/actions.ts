'use server';

import { WeakPasswordError } from '@mojo/identity/application';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getHub } from '../demo/composition-root';
import { checkRateLimit } from './rate-limit';
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
  const limited = checkRateLimit(`login:${await actionIp()}`, 10, 60_000);
  if (!limited.ok) {
    throw new Error(`Too many attempts — try again in ${limited.retryAfterSeconds}s.`);
  }
  const { token, role, user } = await getHub().identity.authenticate(input.email, input.password);

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
  if (token?.startsWith('mojo_') && process.env.USE_PRISMA === 'true') {
    try {
      const { sharedPrismaClient } = await import('../demo/prisma-client');
      const { createHash } = await import('node:crypto');
      await sharedPrismaClient().sessionToken.deleteMany({
        where: { tokenHash: createHash('sha256').update(token).digest('hex') },
      });
    } catch {
      // Cookie clearing below still signs the browser out.
    }
  }
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
    const limited = checkRateLimit(`signup:${await actionIp()}`, 5, 600_000);
    if (!limited.ok) {
      return { error: `Too many attempts — try again in ${limited.retryAfterSeconds}s.` };
    }
    await getHub().identity.register({
      name: input.name,
      email: input.email,
      password: input.password,
      timezone: input.timezone,
      locale: input.locale,
    });

    const { token, role, user } = await getHub().identity.authenticate(input.email, input.password);
    const store = await cookies();
    const options = sessionCookieOptions();
    store.set('mojo_user', token, options);
    store.set('mojo_role', role, options);

    return { redirectTo: user.role === 'tutor' ? '/tutor' : '/' };
  } catch (error) {
    if (error instanceof WeakPasswordError) {
      return { error: `Password too weak — ${error.reasons.join('; ')}.` };
    }
    return { error: error instanceof Error ? error.message : 'Could not create your account.' };
  }
}
