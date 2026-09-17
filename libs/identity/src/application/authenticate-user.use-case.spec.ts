import { describe, expect, it } from 'vitest';
import type { PasswordHasher, TokenIssuer, User, UserRepository } from '../domain';
import {
  AccountSuspendedError,
  InvalidCredentialsError,
  makeAuthenticateUser,
} from './authenticate-user.use-case';

/**
 * Integration test: exercises the real use-case against fake, in-memory
 * implementations of every port — no database, no network, but the actual
 * orchestration logic in the use-case runs for real.
 */
function buildFakes(user: User | null) {
  const users: UserRepository = {
    findByEmail: async (email) => (user && user.email === email ? user : null),
    findById: async (id) => (user && user.id === id ? user : null),
    listByRole: async (role) => (user && user.role === role ? [user] : []),
    save: async () => {},
  };
  const hasher: PasswordHasher = {
    hash: async (plain) => `hashed:${plain}`,
    verify: async (plain, hash) => hash === `hashed:${plain}`,
  };
  const tokens: TokenIssuer = {
    issue: async () => ({ token: 'tok_123', expiresAt: '2026-09-01T00:00:00.000Z' }),
  };
  return { users, hasher, tokens };
}

const baseUser: User = {
  id: 'u_1',
  name: 'Kelechi O.',
  email: 'kelechi@example.com',
  role: 'tutor',
  passwordHash: 'hashed:Correct9Horse',
  timezone: 'Africa/Lagos',
  locale: 'en-NG',
  suspendedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('authenticateUser', () => {
  it('issues a token for correct credentials', async () => {
    const deps = buildFakes(baseUser);
    const authenticateUser = makeAuthenticateUser(deps);

    const result = await authenticateUser({ email: baseUser.email, password: 'Correct9Horse' });

    expect(result.token).toBe('tok_123');
    expect(result.role).toBe('tutor');
  });

  it('rejects an unknown email without revealing that it does not exist', async () => {
    const deps = buildFakes(null);
    const authenticateUser = makeAuthenticateUser(deps);

    await expect(
      authenticateUser({ email: 'nobody@example.com', password: 'whatever' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects a wrong password', async () => {
    const deps = buildFakes(baseUser);
    const authenticateUser = makeAuthenticateUser(deps);

    await expect(
      authenticateUser({ email: baseUser.email, password: 'WrongPassword1' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects a suspended account even with correct credentials', async () => {
    const suspended: User = { ...baseUser, suspendedAt: '2026-08-01T00:00:00.000Z' };
    const deps = buildFakes(suspended);
    const authenticateUser = makeAuthenticateUser(deps);

    await expect(
      authenticateUser({ email: suspended.email, password: 'Correct9Horse' }),
    ).rejects.toThrow(AccountSuspendedError);
  });
});
