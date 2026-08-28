import type { User } from './user.types';

/**
 * Ports — what this module's `application` layer needs from the outside
 * world, defined here so `infrastructure` implements them and `domain`
 * never has to know Prisma exists.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface TokenIssuer {
  issue(userId: string): Promise<{ token: string; expiresAt: string }>;
}
