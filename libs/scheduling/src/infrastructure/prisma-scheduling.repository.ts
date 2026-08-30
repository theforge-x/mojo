import type { PrismaClient } from '@prisma/client';
import type {
  AvailabilityException,
  AvailabilityRule,
  SchedulingSettings,
  Weekday,
} from '../domain/availability.types';
import type { AvailabilityRepository, SessionRepository } from '../domain/scheduling.ports';
import type { ScheduledSession } from '../domain/session.types';

export class PrismaAvailabilityRepository implements AvailabilityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getRules(tutorId: string): Promise<AvailabilityRule[]> {
    const rows = await this.prisma.availabilityRule.findMany({ where: { tutorId } });
    return rows.map((r) => ({ ...r, weekday: r.weekday as Weekday }));
  }

  async saveRules(rules: AvailabilityRule[]): Promise<void> {
    const tutorId = rules[0]?.tutorId ?? '';
    const desired = rules.map((rule) => ({
      id: rule.id,
      tutorId: rule.tutorId,
      weekday: rule.weekday,
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
    }));
    await this.prisma.$transaction([
      this.prisma.availabilityRule.deleteMany({ where: { tutorId } }),
      ...desired.map((rule) => this.prisma.availabilityRule.create({ data: rule })),
    ]);
  }

  async getExceptions(tutorId: string, date: string): Promise<AvailabilityException[]> {
    const rows = await this.prisma.availabilityException.findMany({ where: { tutorId, date } });
    return rows.map((r) => ({ ...r }));
  }

  async getSettings(tutorId: string): Promise<SchedulingSettings> {
    const row = await this.prisma.schedulingSettings.findUniqueOrThrow({ where: { tutorId } });
    return { ...row };
  }

  async saveSettings(settings: SchedulingSettings): Promise<void> {
    await this.prisma.schedulingSettings.upsert({
      where: { tutorId: settings.tutorId },
      create: settings,
      update: settings,
    });
  }
}

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getBookedSessions(
    tutorId: string,
    rangeStartIso: string,
    rangeEndIso: string,
  ): Promise<ScheduledSession[]> {
    const rows = await this.prisma.session.findMany({
      where: {
        tutorId,
        startAt: { lt: new Date(rangeEndIso) },
        endAt: { gt: new Date(rangeStartIso) },
      },
      include: { statusHistory: true },
    });
    return rows.map(toDomain);
  }

  async save(session: ScheduledSession): Promise<void> {
    await this.prisma.session.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        tutorId: session.tutorId,
        studentId: session.studentId,
        startAt: new Date(session.startIso),
        endAt: new Date(session.endIso),
        status: session.status,
        isTrial: session.isTrial,
      },
      update: { status: session.status },
    });
  }

  async findById(id: string): Promise<ScheduledSession | null> {
    const row = await this.prisma.session.findUnique({
      where: { id },
      include: { statusHistory: true },
    });
    return row ? toDomain(row) : null;
  }
}

// biome-ignore lint/suspicious/noExplicitAny: kept light rather than importing every Prisma row type
function toDomain(row: any): ScheduledSession {
  return {
    id: row.id,
    tutorId: row.tutorId,
    studentId: row.studentId,
    startIso: row.startAt.toISOString(),
    endIso: row.endAt.toISOString(),
    status: row.status,
    isTrial: row.isTrial,
    statusHistory: (row.statusHistory ?? []).map((h: any) => ({
      status: h.status,
      at: h.at.toISOString(),
    })),
  };
}
