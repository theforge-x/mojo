import { describe, expect, it } from 'vitest';
import type { PasswordHasher, User, UserRepository } from '../domain';
import { InvalidCredentialsError } from './authenticate-user.use-case';
import { makeChangePassword } from './change-password.use-case';
import {
  AccountNotFoundError,
  InvalidEmailError,
  InvalidNameError,
  makeChangeEmail,
  makeDeactivateAccount,
  makeUpdateDisplayName,
} from './manage-account.use-case';
import { EmailAlreadyRegisteredError, WeakPasswordError } from './register-user.use-case';

function buildFakes(initial: User | null, others: User[] = []) {
  let current = initial;
  const users: UserRepository = {
    findByEmail: async (email) => {
      const all = [...(current ? [current] : []), ...others];
      return all.find((u) => u.email === email) ?? null;
    },
    findById: async (id) => (current && current.id === id ? current : null),
    listByRole: async (role) => {
      const all = [...(current ? [current] : []), ...others];
      return all.filter((u) => u.role === role);
    },
    save: async (user) => {
      current = user;
    },
  };
  const hasher: PasswordHasher = {
    hash: async (plain) => `hashed:${plain}`,
    verify: async (plain, hash) => hash === `hashed:${plain}`,
  };
  return { users, hasher, current: () => current };
}

const baseUser: User = {
  id: 'u_1',
  name: 'Ada Obi',
  email: 'ada@example.com',
  role: 'student',
  passwordHash: 'hashed:Correct9Horse',
  timezone: 'Africa/Lagos',
  locale: 'en-NG',
  suspendedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('changePassword', () => {
  it('rotates the hash when the current password matches and the new one passes policy', async () => {
    const deps = buildFakes({ ...baseUser });
    await makeChangePassword(deps)({
      userId: 'u_1',
      currentPassword: 'Correct9Horse',
      newPassword: 'NewStrong99Pass',
    });
    expect(deps.current()?.passwordHash).toBe('hashed:NewStrong99Pass');
  });

  it('rejects a wrong current password', async () => {
    const deps = buildFakes({ ...baseUser });
    await expect(
      makeChangePassword(deps)({
        userId: 'u_1',
        currentPassword: 'nope',
        newPassword: 'NewStrong99Pass',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects a weak new password', async () => {
    const deps = buildFakes({ ...baseUser });
    await expect(
      makeChangePassword(deps)({
        userId: 'u_1',
        currentPassword: 'Correct9Horse',
        newPassword: 'short',
      }),
    ).rejects.toThrow(WeakPasswordError);
  });
});

describe('updateDisplayName', () => {
  it('trims and saves the new name', async () => {
    const deps = buildFakes({ ...baseUser });
    await makeUpdateDisplayName(deps)({ userId: 'u_1', name: '  Ada  Obioma ' });
    expect(deps.current()?.name).toBe('Ada Obioma');
  });

  it('rejects a blank name and an unknown user', async () => {
    const deps = buildFakes({ ...baseUser });
    await expect(makeUpdateDisplayName(deps)({ userId: 'u_1', name: ' ' })).rejects.toThrow(
      InvalidNameError,
    );
    await expect(makeUpdateDisplayName(deps)({ userId: 'ghost', name: 'Ada' })).rejects.toThrow(
      AccountNotFoundError,
    );
  });
});

describe('changeEmail', () => {
  it('moves sign-in to the new address', async () => {
    const deps = buildFakes({ ...baseUser });
    await makeChangeEmail(deps)({
      userId: 'u_1',
      email: 'Ada.New@example.com',
      currentPassword: 'Correct9Horse',
    });
    expect(deps.current()?.email).toBe('ada.new@example.com');
  });

  it('rejects taken and malformed addresses', async () => {
    const other: User = { ...baseUser, id: 'u_2', email: 'taken@example.com' };
    const deps = buildFakes({ ...baseUser }, [other]);
    await expect(
      makeChangeEmail(deps)({
        userId: 'u_1',
        email: 'taken@example.com',
        currentPassword: 'Correct9Horse',
      }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
    await expect(
      makeChangeEmail(deps)({
        userId: 'u_1',
        email: 'not-an-email',
        currentPassword: 'Correct9Horse',
      }),
    ).rejects.toThrow(InvalidEmailError);
  });
});

describe('deactivateAccount', () => {
  it('stamps suspendedAt after verifying the password', async () => {
    const deps = buildFakes({ ...baseUser });
    await makeDeactivateAccount(deps)({
      userId: 'u_1',
      currentPassword: 'Correct9Horse',
      nowIso: '2026-09-17T00:00:00.000Z',
    });
    expect(deps.current()?.suspendedAt).toBe('2026-09-17T00:00:00.000Z');
  });

  it('rejects a wrong password', async () => {
    const deps = buildFakes({ ...baseUser });
    await expect(
      makeDeactivateAccount(deps)({ userId: 'u_1', currentPassword: 'nope' }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(deps.current()?.suspendedAt).toBeNull();
  });
});
