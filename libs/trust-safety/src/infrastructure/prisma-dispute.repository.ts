import type { PrismaClient } from '@prisma/client';
import type { DisputeRepository } from '../domain/trust-safety.ports';
import type { Dispute } from '../domain/trust-safety.types';

export class PrismaDisputeRepository implements DisputeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Dispute | null> {
    const row = await this.prisma.dispute.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findBySession(sessionId: string): Promise<Dispute | null> {
    const row = await this.prisma.dispute.findUnique({ where: { sessionId } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(dispute: Dispute): Promise<void> {
    await this.prisma.dispute.upsert({
      where: { sessionId: dispute.sessionId },
      create: {
        id: dispute.id,
        sessionId: dispute.sessionId,
        filedBy: dispute.filedBy,
        reason: dispute.reason,
        status: dispute.status,
        filedAt: new Date(dispute.filedAt),
        resolvedAt: dispute.resolvedAt ? new Date(dispute.resolvedAt) : null,
      },
      update: { status: dispute.status, resolvedAt: dispute.resolvedAt ? new Date(dispute.resolvedAt) : null },
    });
  }

  private toDomain(row: {
    id: string;
    sessionId: string;
    filedBy: string;
    reason: string;
    status: string;
    filedAt: Date;
    resolvedAt: Date | null;
  }): Dispute {
    return {
      id: row.id,
      sessionId: row.sessionId,
      filedBy: row.filedBy,
      reason: row.reason,
      status: row.status as Dispute['status'],
      filedAt: row.filedAt.toISOString(),
      resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    };
  }
}
