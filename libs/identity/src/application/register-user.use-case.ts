import type { PasswordHasher, UserRepository } from '../domain/identity.ports';
import { checkPasswordPolicy } from '../domain/password-policy';
import type { Role, User } from '../domain/user.types';

export interface RegisterUserInput {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  timezone: string;
  locale: string;
}

export class WeakPasswordError extends Error {
  constructor(readonly reasons: readonly string[]) {
    super('Password does not meet the policy.');
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('An account with this email already exists.');
  }
}

export function makeRegisterUser(deps: { users: UserRepository; hasher: PasswordHasher }) {
  return async function registerUser(input: RegisterUserInput): Promise<User> {
    const policy = checkPasswordPolicy(input.password);
    if (!policy.valid) throw new WeakPasswordError(policy.reasons);

    const existing = await deps.users.findByEmail(input.email);
    if (existing) throw new EmailAlreadyRegisteredError();

    const user: User = {
      id: input.id,
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await deps.hasher.hash(input.password),
      timezone: input.timezone,
      locale: input.locale,
      suspendedAt: null,
      createdAt: new Date().toISOString(),
    };
    await deps.users.save(user);
    return user;
  };
}
