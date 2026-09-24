import { PrismaClient } from '@prisma/client';

const GLOBAL_KEY = Symbol.for('mojo.hub.prisma');

/**
 * Process-wide Prisma client. `buildPrismaRepositories()` used to mint a new
 * client per call — on serverless that exhausts the Postgres connection pool.
 */
export function sharedPrismaClient(): PrismaClient {
  const globals = globalThis as Record<PropertyKey, unknown>;
  const existing = globals[GLOBAL_KEY] as PrismaClient | undefined;
  if (existing) return existing;
  const fresh = new PrismaClient();
  globals[GLOBAL_KEY] = fresh;
  return fresh;
}
