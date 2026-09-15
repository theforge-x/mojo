import { createHash, randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { SessionStore, TokenIssuer } from '../domain/identity.ports';

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class PrismaSessionStore implements SessionStore {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { tokenHash: string; userId: string; expiresAt: string }): Promise<void> {
    await this.prisma.sessionToken.create({
      data: {
        tokenHash: input.tokenHash,
        userId: input.userId,
        expiresAt: new Date(input.expiresAt),
      },
    });
  }

  async findUser(input: {
    tokenHash: string;
  }): Promise<{ userId: string; expiresAt: string } | null> {
    const row = await this.prisma.sessionToken.findUnique({
      where: { tokenHash: input.tokenHash },
    });
    if (!row) return null;
    return { userId: row.userId, expiresAt: row.expiresAt.toISOString() };
  }

  async revoke(tokenHash: string): Promise<void> {
    await this.prisma.sessionToken.deleteMany({ where: { tokenHash } });
  }
}

/**
 * Opaque `mojo_`-prefixed tokens backed by the session table. Unlike the
 * demo `MemTokenIssuer`, the user id is never embedded in the token — it is
 * only recoverable through the stored hash, and expiry is enforced on read.
 */
export class DbTokenIssuer implements TokenIssuer {
  constructor(private readonly sessions: SessionStore) {}

  async issue(userId: string): Promise<{ token: string; expiresAt: string }> {
    const token = `mojo_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await this.sessions.create({ tokenHash: hashSessionToken(token), userId, expiresAt });
    return { token, expiresAt };
  }
}
