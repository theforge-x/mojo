import type { PasswordHasher, UserRepository } from '../domain/identity.ports';
import { AccountSuspendedError, InvalidCredentialsError } from './authenticate-user.use-case';
import { EmailAlreadyRegisteredError } from './register-user.use-case';

export class AccountNotFoundError extends Error {
  constructor() {
    super('Account not found.');
  }
}

export class InvalidEmailError extends Error {
  constructor() {
    super('Enter a valid email address.');
  }
}

export class InvalidNameError extends Error {
  constructor() {
    super('Name must be 2–60 characters.');
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Renames the account's display name (sign-in identity is untouched). */
export function makeUpdateDisplayName(deps: { users: UserRepository }) {
  return async function updateDisplayName(input: { userId: string; name: string }): Promise<void> {
    const user = await deps.users.findById(input.userId);
    if (!user) throw new AccountNotFoundError();
    if (user.suspendedAt) throw new AccountSuspendedError();
    const name = input.name.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 60) throw new InvalidNameError();
    await deps.users.save({ ...user, name });
  };
}

/**
 * Moves sign-in to a new email after re-verifying the password. Uniqueness
 * is enforced case-insensitively, matching registration.
 */
export function makeChangeEmail(deps: { users: UserRepository; hasher: PasswordHasher }) {
  return async function changeEmail(input: {
    userId: string;
    email: string;
    currentPassword: string;
  }): Promise<void> {
    const user = await deps.users.findById(input.userId);
    if (!user) throw new AccountNotFoundError();
    if (user.suspendedAt) throw new AccountSuspendedError();

    const passwordOk = await deps.hasher.verify(input.currentPassword, user.passwordHash);
    if (!passwordOk) throw new InvalidCredentialsError();

    const email = normalizeEmail(input.email);
    if (!isPlausibleEmail(email)) throw new InvalidEmailError();
    if (email === user.email) return;

    const taken = await deps.users.findByEmail(email);
    if (taken && taken.id !== user.id) throw new EmailAlreadyRegisteredError();

    await deps.users.save({ ...user, email });
  };
}

/**
 * Deactivates the account effective immediately: future sign-ins and token
 * resolutions fail the suspended check, and the settings UI signs the
 * browser out right after. History (sessions, charges, reviews) is kept for
 * audit and refund integrity rather than cascade-deleted.
 */
export function makeDeactivateAccount(deps: { users: UserRepository; hasher: PasswordHasher }) {
  return async function deactivateAccount(input: {
    userId: string;
    currentPassword: string;
    nowIso?: string;
  }): Promise<void> {
    const user = await deps.users.findById(input.userId);
    if (!user) throw new AccountNotFoundError();
    if (user.suspendedAt) return;

    const passwordOk = await deps.hasher.verify(input.currentPassword, user.passwordHash);
    if (!passwordOk) throw new InvalidCredentialsError();

    await deps.users.save({ ...user, suspendedAt: input.nowIso ?? new Date().toISOString() });
  };
}
