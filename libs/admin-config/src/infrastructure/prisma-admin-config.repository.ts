import type { PrismaClient } from '@prisma/client';
import type {
  AuditLogRepository,
  FeatureFlagRepository,
  SubjectTaxonomyRepository,
} from '../domain/admin-config.ports';
import type {
  AuditLogEntry,
  FeatureFlag,
  SubjectTaxonomyEntry,
} from '../domain/admin-config.types';

export class PrismaFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByKey(key: string): Promise<FeatureFlag | null> {
    const row = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!row) return null;
    return { key: row.key, enabled: row.enabled, rolloutPercent: row.rolloutPercent };
  }

  async list(): Promise<FeatureFlag[]> {
    const rows = await this.prisma.featureFlag.findMany();
    return rows.map((r) => ({ key: r.key, enabled: r.enabled, rolloutPercent: r.rolloutPercent }));
  }

  async save(flag: FeatureFlag): Promise<void> {
    await this.prisma.featureFlag.upsert({
      where: { key: flag.key },
      create: { key: flag.key, enabled: flag.enabled, rolloutPercent: flag.rolloutPercent },
      update: { enabled: flag.enabled, rolloutPercent: flag.rolloutPercent },
    });
  }
}

export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLogEntry.create({
      data: {
        id: entry.id,
        adminId: entry.adminId,
        action: entry.action,
        targetId: entry.targetId,
        at: new Date(entry.at),
      },
    });
  }

  async list(): Promise<AuditLogEntry[]> {
    const rows = await this.prisma.auditLogEntry.findMany({ orderBy: { at: 'desc' } });
    return rows.map((r) => ({
      id: r.id,
      adminId: r.adminId,
      action: r.action,
      targetId: r.targetId,
      at: r.at.toISOString(),
    }));
  }
}

export class PrismaSubjectTaxonomyRepository implements SubjectTaxonomyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<SubjectTaxonomyEntry[]> {
    const rows = await this.prisma.subjectTaxonomyEntry.findMany();
    return rows.map((r) => ({ id: r.id, name: r.name, parentId: r.parentId, active: r.active }));
  }

  async save(entry: SubjectTaxonomyEntry): Promise<void> {
    await this.prisma.subjectTaxonomyEntry.upsert({
      where: { id: entry.id },
      create: { id: entry.id, name: entry.name, parentId: entry.parentId, active: entry.active },
      update: { name: entry.name, parentId: entry.parentId, active: entry.active },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.subjectTaxonomyEntry.delete({ where: { id } });
  }
}
