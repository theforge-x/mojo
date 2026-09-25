import { WeakPasswordError } from '@mojo/identity/application';
import type { Role } from '@mojo/identity/domain';
import { getHub } from '../demo/composition-root';
import { checkRateLimit } from './rate-limit';

export interface CredentialAccount {
  readonly token: string;
  readonly role: Role;
  readonly user: { readonly id: string; readonly email: string; readonly role: Role };
}

export type CredentialResult =
  | { ok: true; account: CredentialAccount }
  | { ok: false; error: string };

/**
 * The single credential-auth funnel for web and mobile. Both the `/api/auth`
 * REST routes (the mobile contract) and the `loginWithDemo`/`signupWithDemo`
 * server actions (the web forms) delegate here, so rate limits, password
 * policy messages, and session issuance can never drift between transports.
 * Callers own their transport: routes set cookies + return the token in the
 * body, actions set cookies + redirect.
 */
export async function authenticateCredentials(input: {
  email: string;
  password: string;
  clientKey: string;
}): Promise<CredentialResult> {
  const limited = checkRateLimit(`login:${input.clientKey}`, 10, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts — try again in ${limited.retryAfterSeconds}s.` };
  }
  try {
    const { token, user } = await getHub().identity.authenticate(input.email, input.password);
    return {
      ok: true,
      account: {
        token,
        role: user.role,
        user: { id: user.id, email: user.email, role: user.role },
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Sign-in failed.' };
  }
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  timezone: string;
  locale: string;
  clientKey: string;
}): Promise<CredentialResult> {
  const limited = checkRateLimit(`signup:${input.clientKey}`, 5, 600_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts — try again in ${limited.retryAfterSeconds}s.` };
  }
  try {
    await getHub().identity.register({
      name: input.name,
      email: input.email,
      password: input.password,
      timezone: input.timezone,
      locale: input.locale,
    });
    const { token, user } = await getHub().identity.authenticate(input.email, input.password);
    return {
      ok: true,
      account: {
        token,
        role: user.role,
        user: { id: user.id, email: user.email, role: user.role },
      },
    };
  } catch (error) {
    if (error instanceof WeakPasswordError) {
      return { ok: false, error: `Password too weak — ${error.reasons.join('; ')}.` };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not create your account.',
    };
  }
}

/**
 * Revokes a session token server-side (Prisma mode; demo memory needs no
 * revocation). Shared by web logout and the mobile logout route.
 */
export async function revokeSessionToken(token: string): Promise<void> {
  if (!token.startsWith('mojo_') || process.env.USE_PRISMA !== 'true') return;
  try {
    const { sharedPrismaClient } = await import('../demo/prisma-client');
    const { createHash } = await import('node:crypto');
    await sharedPrismaClient().sessionToken.deleteMany({
      where: { tokenHash: createHash('sha256').update(token).digest('hex') },
    });
  } catch {
    // Cookie clearing / client token drop still signs the user out.
  }
}
