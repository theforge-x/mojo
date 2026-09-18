import { eventBus } from '@mojo/shared/events';
import { describe, expect, it } from 'vitest';
import type {
  AvailabilityException,
  AvailabilityRepository,
  AvailabilityRule,
  SchedulingSettings,
  SessionRepository,
} from '../domain';
import type { ScheduledSession } from '../domain/session.types';
import { SchedulingConflictError } from './book-session.use-case';
import { SessionNotFoundError } from './cancel-session.use-case';
import { makeRescheduleSession } from './reschedule-session.use-case';

const ALL_DAY: AvailabilityRule[] = Array.from({ length: 7 }, (_, weekday) => ({
  id: `all-${weekday}`,
  tutorId: 't_1',
  weekday: weekday as AvailabilityRule['weekday'],
  startMinute: 0,
  endMinute: 1440,
}));

function session(overrides: Partial<ScheduledSession> = {}): ScheduledSession {
  return {
    id: 's_1',
    tutorId: 't_1',
    studentId: 'st_1',
    startIso: '2026-09-02T10:00:00.000Z',
    endIso: '2026-09-02T10:30:00.000Z',
    status: 'booked',
    isTrial: false,
    statusHistory: [{ status: 'booked', at: '2026-09-01T09:00:00.000Z' }],
    ...overrides,
  };
}

function buildFakes(
  existing: ScheduledSession[],
  settingsOverride: Partial<SchedulingSettings> = {},
  exceptions: AvailabilityException[] = [],
  rules: AvailabilityRule[] = ALL_DAY,
) {
  const saved: ScheduledSession[] = [];
  const settings: SchedulingSettings = {
    tutorId: 't_1',
    timezone: 'Africa/Lagos',
    bufferMinutes: 15,
    minimumNoticeMinutes: 60,
    pausedForNewBookings: false,
    ...settingsOverride,
  };
  const availability: AvailabilityRepository = {
    getRules: async () => rules,
    getExceptions: async (_tutorId, date) => exceptions.filter((e) => e.date === date),
    listExceptions: async () => exceptions,
    saveExceptions: async () => {},
    getSettings: async () => settings,
    saveSettings: async () => {},
  };
  const sessions: SessionRepository = {
    getBookedSessions: async (_tutorId, rangeStartIso, rangeEndIso) =>
      existing.filter((s) => s.startIso < rangeEndIso && s.endIso > rangeStartIso),
    save: async (s) => {
      saved.push(s);
    },
    findById: async (id) => existing.find((s) => s.id === id) ?? null,
    listByGroup: async () => [],
  };
  return { availability, sessions, saved };
}

describe('rescheduleSession', () => {
  it('moves a booked session in place and publishes SessionRescheduled', async () => {
    const current = session();
    const { availability, sessions, saved } = buildFakes([current]);
    let published: unknown = null;
    eventBus.subscribe('SessionRescheduled', (e) => {
      published = e;
    });
    const reschedule = makeRescheduleSession({ availability, sessions });

    const moved = await reschedule({
      sessionId: 's_1',
      newStartIso: '2026-09-03T10:00:00.000Z',
      newEndIso: '2026-09-03T10:30:00.000Z',
      nowIso: '2026-09-01T09:00:00.000Z',
    });

    // Same id (the student charge still settles it), new clock, same status.
    expect(moved.id).toBe('s_1');
    expect(moved.startIso).toBe('2026-09-03T10:00:00.000Z');
    expect(moved.status).toBe('booked');
    expect(saved).toHaveLength(1);
    expect(published).toMatchObject({
      payload: { sessionId: 's_1', oldStartIso: current.startIso },
    });
  });

  it('allows confirmed sessions and keeps the confirmed status', async () => {
    const current = session({ status: 'confirmed' });
    const { availability, sessions } = buildFakes([current]);
    const reschedule = makeRescheduleSession({ availability, sessions });

    const moved = await reschedule({
      sessionId: 's_1',
      newStartIso: '2026-09-03T10:00:00.000Z',
      newEndIso: '2026-09-03T10:30:00.000Z',
      nowIso: '2026-09-01T09:00:00.000Z',
    });
    expect(moved.status).toBe('confirmed');
  });

  it('throws for an unknown session', async () => {
    const { availability, sessions } = buildFakes([]);
    const reschedule = makeRescheduleSession({ availability, sessions });
    await expect(
      reschedule({
        sessionId: 'missing',
        newStartIso: '2026-09-03T10:00:00.000Z',
        newEndIso: '2026-09-03T10:30:00.000Z',
        nowIso: '2026-09-01T09:00:00.000Z',
      }),
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('rejects terminal sessions', async () => {
    for (const status of ['completed', 'cancelled', 'no_show'] as const) {
      const { availability, sessions } = buildFakes([session({ status })]);
      const reschedule = makeRescheduleSession({ availability, sessions });
      await expect(
        reschedule({
          sessionId: 's_1',
          newStartIso: '2026-09-03T10:00:00.000Z',
          newEndIso: '2026-09-03T10:30:00.000Z',
          nowIso: '2026-09-01T09:00:00.000Z',
        }),
      ).rejects.toThrow(SchedulingConflictError);
    }
  });

  it('ignores the session itself when checking conflicts', async () => {
    // A 15-minute shift still overlaps the old time — allowed when nothing
    // else is booked, because the old booking is excluded from the check.
    const current = session();
    const { availability, sessions, saved } = buildFakes([current]);
    const reschedule = makeRescheduleSession({ availability, sessions });

    const moved = await reschedule({
      sessionId: 's_1',
      newStartIso: '2026-09-02T10:15:00.000Z',
      newEndIso: '2026-09-02T10:45:00.000Z',
      nowIso: '2026-09-01T09:00:00.000Z',
    });
    expect(moved.startIso).toBe('2026-09-02T10:15:00.000Z');
    expect(saved).toHaveLength(1);
  });

  it('still conflicts with other sessions', async () => {
    const current = session();
    const other = session({
      id: 's_2',
      startIso: '2026-09-03T10:00:00.000Z',
      endIso: '2026-09-03T11:00:00.000Z',
    });
    const { availability, sessions } = buildFakes([current, other]);
    const reschedule = makeRescheduleSession({ availability, sessions });

    await expect(
      reschedule({
        sessionId: 's_1',
        newStartIso: '2026-09-03T10:30:00.000Z',
        newEndIso: '2026-09-03T11:00:00.000Z',
        nowIso: '2026-09-01T09:00:00.000Z',
      }),
    ).rejects.toThrow(/overlaps an existing session/);
  });

  it('enforces the notice window and availability on the new slot', async () => {
    const current = session();
    const { availability, sessions } = buildFakes([current]);
    const reschedule = makeRescheduleSession({ availability, sessions });

    await expect(
      reschedule({
        sessionId: 's_1',
        newStartIso: '2026-09-01T09:30:00.000Z',
        newEndIso: '2026-09-01T10:00:00.000Z',
        nowIso: '2026-09-01T09:00:00.000Z',
      }),
    ).rejects.toThrow(/at least 60 minutes ahead/);

    await expect(
      reschedule({
        sessionId: 's_1',
        newStartIso: '2026-09-03T10:00:00.000Z',
        newEndIso: '2026-09-03T09:00:00.000Z',
        nowIso: '2026-09-01T09:00:00.000Z',
      }),
    ).rejects.toThrow(/ends before it starts/);
  });
});
