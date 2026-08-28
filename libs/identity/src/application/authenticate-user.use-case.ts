import type { PasswordHasher, TokenIssuer, UserRepository } from '../domain/identity.ports';

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticateUserResult {
  token: string;
  expiresAt: string;
  role: string;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.');
  }
}

export class AccountSuspendedError extends Error {
  constructor() {
    super('This account has been suspended.');
  }
}

/**
 * Depends only on ports — no Prisma import here, so this use-case is
 * testable with in-memory fakes (see the .spec next to this file) and
 * portable to `apps/api` for mobile later without a rewrite.
 */
export function makeAuthenticateUser(deps: {
  users: UserRepository;
  hasher: PasswordHasher;
  tokens: TokenIssuer;
}) {
  return async function authenticateUser(input: AuthenticateUserInput): Promise<AuthenticateUserResult> {
    const user = await deps.users.findByEmail(input.email);
    if (!user) throw new InvalidCredentialsError();

    const passwordOk = await deps.hasher.verify(input.password, user.passwordHash);
    if (!passwordOk) throw new InvalidCredentialsError();

    if (user.suspendedAt) throw new AccountSuspendedError();

    const { token, expiresAt } = await deps.tokens.issue(user.id);
    return { token, expiresAt, role: user.role };
  };
}
