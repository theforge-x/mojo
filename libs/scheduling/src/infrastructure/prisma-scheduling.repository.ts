import type { PrismaClient } from '@prisma/client';
import type {
  AvailabilityException,
  AvailabilityRule,
  SchedulingSettings,
  Weekday,
} from '../domain/availability.types';
import type { GroupLab, GroupLabStatus } from '../domain/group-lab.types';
import type {
  AvailabilityRepository,
  GroupLabRepository,
  SessionRepository,
} from '../domain/scheduling.ports';
import type { ScheduledSession } from '../domain/session.types';

const DEFAULT_BUFFER_MINUTES = 15;
const DEFAULT_NOTICE_MINUTES = 60;

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

  async listExceptions(
    tutorId: string,
    fromDate: string,
    toDate: string,
  ): Promise<AvailabilityException[]> {
    const rows = await this.prisma.availabilityException.findMany({
      where: { tutorId, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: 'asc' },
    });
    return rows.map((r) => ({ ...r }));
  }

  async saveExceptions(
    tutorId: string,
    date: string,
    exceptions: Omit<AvailabilityException, 'tutorId' | 'date'>[],
  ): Promise<void> {
    const rows = exceptions.map((e) => ({ ...e, id: e.id, tutorId, date }));
    await this.prisma.$transaction([
      this.prisma.availabilityException.deleteMany({ where: { tutorId, date } }),
      ...rows.map((row) => this.prisma.availabilityException.create({ data: row })),
    ]);
  }

  async getSettings(tutorId: string): Promise<SchedulingSettings> {
    const row = await this.prisma.schedulingSettings.findUnique({ where: { tutorId } });
    if (row) return { ...row };
    // No settings row yet (a just-approved tutor, or an applicant whose
    // scheduling save raced their first settings write). Seed one from the
    // account's timezone so slot generation is tz-correct rather than throwing
    // findUniqueOrThrow and 500ing the apply/availability/booking routes.
    const user = await this.prisma.user.findUnique({ where: { id: tutorId } });
    const defaults: SchedulingSettings = {
      tutorId,
      timezone: user?.timezone || 'Africa/Lagos',
      bufferMinutes: DEFAULT_BUFFER_MINUTES,
      minimumNoticeMinutes: DEFAULT_NOTICE_MINUTES,
      pausedForNewBookings: false,
    };
    await this.saveSettings(defaults);
    return defaults;
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
        groupId: session.groupId,
        groupSize: session.groupSize,
      },
      // In-place moves (reschedule) change the clock, not just the status —
      // persist both so the Prisma path matches the in-memory store.
      update: {
        startAt: new Date(session.startIso),
        endAt: new Date(session.endIso),
        status: session.status,
        groupId: session.groupId,
        groupSize: session.groupSize,
      },
    });
  }

  async findById(id: string): Promise<ScheduledSession | null> {
    const row = await this.prisma.session.findUnique({
      where: { id },
      include: { statusHistory: true },
    });
    return row ? toDomain(row) : null;
  }

  async listByGroup(groupId: string): Promise<ScheduledSession[]> {
    const rows = await this.prisma.session.findMany({
      where: { groupId },
      include: { statusHistory: true },
      orderBy: { startAt: 'asc' },
    });
    return rows.map(toDomain);
  }
}

export class PrismaGroupLabRepository implements GroupLabRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(groupId: string): Promise<GroupLab | null> {
    const row = await this.prisma.groupLab.findUnique({ where: { id: groupId } });
    return row ? toGroupLab(row) : null;
  }

  async listByTutor(tutorId: string): Promise<GroupLab[]> {
    const rows = await this.prisma.groupLab.findMany({
      where: { tutorId },
      orderBy: { startAt: 'asc' },
    });
    return rows.map(toGroupLab);
  }

  async listOpenByTutor(tutorId: string): Promise<GroupLab[]> {
    const rows = await this.prisma.groupLab.findMany({
      where: { tutorId, status: 'open' },
      orderBy: { startAt: 'asc' },
    });
    return rows.map(toGroupLab);
  }

  async save(group: GroupLab): Promise<void> {
    await this.prisma.groupLab.upsert({
      where: { id: group.id },
      create: {
        id: group.id,
        tutorId: group.tutorId,
        title: group.title,
        startAt: new Date(group.startIso),
        endAt: new Date(group.endIso),
        maxSeats: group.maxSeats,
        status: group.status,
        lockedSize: group.lockedSize,
      },
      update: {
        title: group.title,
        startAt: new Date(group.startIso),
        endAt: new Date(group.endIso),
        maxSeats: group.maxSeats,
        status: group.status,
        lockedSize: group.lockedSize,
      },
    });
  }
}

// biome-ignore lint/suspicious/noExplicitAny: kept light rather than importing every Prisma row type
function toGroupLab(row: any): GroupLab {
  return {
    id: row.id,
    tutorId: row.tutorId,
    title: row.title,
    startIso: row.startAt.toISOString(),
    endIso: row.endAt.toISOString(),
    maxSeats: row.maxSeats,
    status: row.status as GroupLabStatus,
    lockedSize: row.lockedSize,
    createdAt: row.createdAt.toISOString(),
  };
}

// biome-ignore lint/suspicious/noExplicitAny: kept light rather than importing every Prisma row type
function toDomain(row: any): ScheduledSession {
  return {
    id: row.id,
    tutorId: row.tutorId,
    studentId: row.studentId,
    startIso: row.startAt.toISOString(),
    endIso: row.endIso.toISOString(),
    status: row.status,
    isTrial: row.isTrial,
    groupId: row.groupId ?? null,
    groupSize: row.groupSize ?? null,
    statusHistory: (row.statusHistory ?? []).map((h: { status: string; at: Date }) => ({
      status: h.status as ScheduledSession['status'],
      at: h.at.toISOString(),
    })),
  };
}
