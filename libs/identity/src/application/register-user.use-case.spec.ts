import { describe, expect, it } from 'vitest';
import type { PasswordHasher, User, UserRepository } from '../domain';
import {
  EmailAlreadyRegisteredError,
  makeRegisterUser,
  WeakPasswordError,
} from './register-user.use-case';

function buildFakes(existing: User | null) {
  const saved: User[] = [];
  const users: UserRepository = {
    findByEmail: async (email) => (existing && existing.email === email ? existing : null),
    findById: async (id) => saved.find((u) => u.id === id) ?? null,
    listByRole: async (role) => [
      ...(existing && existing.role === role ? [existing] : []),
      ...saved.filter((u) => u.role === role),
    ],
    save: async (user) => {
      saved.push(user);
    },
  };
  const hasher: PasswordHasher = {
    hash: async (plain) => `hashed:${plain}`,
    verify: async (plain, hash) => hash === `hashed:${plain}`,
  };
  return { users, hasher, saved };
}

const input = {
  id: 'st_9',
  name: 'Ada Obi',
  email: 'ada@example.com',
  password: 'Correct9Horse',
  role: 'student' as const,
  timezone: 'Africa/Lagos',
  locale: 'en-NG',
};

describe('registerUser', () => {
  it('hashes the password and persists the user', async () => {
    const { users, hasher, saved } = buildFakes(null);
    const user = await makeRegisterUser({ users, hasher })(input);

    expect(user.passwordHash).toBe('hashed:Correct9Horse');
    expect(user.suspendedAt).toBeNull();
    expect(saved).toHaveLength(1);
  });

  it('rejects a weak password', async () => {
    const { users, hasher } = buildFakes(null);
    await expect(
      makeRegisterUser({ users, hasher })({ ...input, password: 'short' }),
    ).rejects.toThrow(WeakPasswordError);
  });

  it('rejects an already-registered email', async () => {
    const existing: User = {
      id: 'st_1',
      name: 'Ada Obi',
      email: input.email,
      role: 'student',
      passwordHash: 'hashed:old',
      timezone: 'Africa/Lagos',
      locale: 'en-NG',
      suspendedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const { users, hasher, saved } = buildFakes(existing);
    await expect(makeRegisterUser({ users, hasher })(input)).rejects.toThrow(
      EmailAlreadyRegisteredError,
    );
    expect(saved).toHaveLength(0);
  });
});
