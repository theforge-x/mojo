import type { PrismaClient } from '@prisma/client';
import type { User } from '../domain/user.types';
import type { UserRepository } from '../domain/identity.ports';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: { ...user },
      update: { ...user },
    });
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Prisma's generated row type isn't imported to keep this file light
function toDomain(row: any): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    passwordHash: row.passwordHash,
    timezone: row.timezone,
    locale: row.locale,
    suspendedAt: row.suspendedAt ? row.suspendedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
