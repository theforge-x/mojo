import type { User } from './user.types';

/**
 * Ports — what this module's `application` layer needs from the outside
 * world, defined here so `infrastructure` implements them and `domain`
 * never has to know Prisma exists.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  listByRole(role: User['role']): Promise<User[]>;
  save(user: User): Promise<void>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface TokenIssuer {
  issue(userId: string): Promise<{ token: string; expiresAt: string }>;
}

/**
 * Server-side session record. Demo mode keeps sessions in the
 * composition-root's issued-tokens map; Prisma mode persists a hash of each
 * opaque token so any app server can resolve and expire it.
 */
export interface SessionStore {
  create(input: { tokenHash: string; userId: string; expiresAt: string }): Promise<void>;
  findUser(input: { tokenHash: string }): Promise<{ userId: string; expiresAt: string } | null>;
  revoke(tokenHash: string): Promise<void>;
}
