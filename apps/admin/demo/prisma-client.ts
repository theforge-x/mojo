import { PrismaClient } from '@prisma/client';

const GLOBAL_KEY = Symbol.for('mojo.admin.prisma');

/** Process-wide Prisma client (see the hub's equivalent note). */
export function sharedAdminPrismaClient(): PrismaClient {
  const globals = globalThis as Record<PropertyKey, unknown>;
  const existing = globals[GLOBAL_KEY] as PrismaClient | undefined;
  if (existing) return existing;
  const fresh = new PrismaClient();
  globals[GLOBAL_KEY] = fresh;
  return fresh;
}
