import type { Dispute, Suspension } from './trust-safety.types';

export interface DisputeRepository {
  findById(id: string): Promise<Dispute | null>;
  findBySession(sessionId: string): Promise<Dispute | null>;
  save(dispute: Dispute): Promise<void>;
}

/**
 * Account suspensions. Only an in-memory implementation is wired for now —
 * there is no suspension table in `prisma/schema.prisma` yet, so the Prisma
 * path stays unwired until a migration adds one.
 */
export interface SuspensionRepository {
  findByUser(userId: string): Promise<Suspension | null>;
  save(suspension: Suspension): Promise<void>;
}
