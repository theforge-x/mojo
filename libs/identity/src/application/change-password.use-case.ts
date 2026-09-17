import type { PasswordHasher, UserRepository } from '../domain/identity.ports';
import { checkPasswordPolicy } from '../domain/password-policy';
import { AccountSuspendedError, InvalidCredentialsError } from './authenticate-user.use-case';
import { WeakPasswordError } from './register-user.use-case';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * Rotates a user's password after re-verifying the current one — the same
 * check as sign-in, so a stolen session cookie alone can't lock the owner
 * out. Suspended accounts stay read-only.
 */
export function makeChangePassword(deps: { users: UserRepository; hasher: PasswordHasher }) {
  return async function changePassword(input: ChangePasswordInput): Promise<void> {
    const user = await deps.users.findById(input.userId);
    if (!user) throw new InvalidCredentialsError();
    if (user.suspendedAt) throw new AccountSuspendedError();

    const currentOk = await deps.hasher.verify(input.currentPassword, user.passwordHash);
    if (!currentOk) throw new InvalidCredentialsError();

    const policy = checkPasswordPolicy(input.newPassword);
    if (!policy.valid) throw new WeakPasswordError(policy.reasons);

    await deps.users.save({ ...user, passwordHash: await deps.hasher.hash(input.newPassword) });
  };
}
