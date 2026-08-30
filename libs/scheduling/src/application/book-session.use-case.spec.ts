import { eventBus } from '@mojo/shared/events';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  AvailabilityException,
  AvailabilityRepository,
  AvailabilityRule,
  SchedulingSettings,
} from '../domain';
import type { ScheduledSession } from '../domain/session.types';
import { makeBookSession, SchedulingConflictError } from './book-session.use-case';

const ALL_DAY = Array.from({ length: 7 }, (_, weekday) => ({
  id: `all-${weekday}`,
  tutorId: 't_1',
  weekday,
  startMinute: 0,
  endMinute: 1440,
}));

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
    getBookedSessions: async () => existing,
    save: async (s) => {
      saved.push(s);
    },
    findById: async (id) => existing.find((s) => s.id === id) ?? null,
  };
  return { availability, sessions, saved };
}

describe('bookSession', () => {
  beforeEach(() => {
    // fresh bus per test would be cleaner; acceptable here since these tests
    // only assert on the use-case's return value and saved state.
  });

  it('books a session with no conflicts and publishes SessionBooked', async () => {
    const { availability, sessions, saved } = buildFakes([]);
    let published: unknown = null;
    eventBus.subscribe('SessionBooked', (e) => {
      published = e;
    });
    const bookSession = makeBookSession({ availability, sessions });

    const result = await bookSession({
      sessionId: 's_new',
      tutorId: 't_1',
      studentId: 'st_1',
      startIso: '2026-09-02T10:00:00.000Z',
      endIso: '2026-09-02T10:30:00.000Z',
      isTrial: false,
      nowIso: '2026-09-01T09:00:00.000Z',
    });

    expect(result.status).toBe('booked');
    expect(saved).toHaveLength(1);
    expect(published).toMatchObject({ payload: { sessionId: 's_new' } });
  });

  it('rejects a booking inside the minimum notice window', async () => {
    const { availability, sessions } = buildFakes([]);
    const bookSession = makeBookSession({ availability, sessions });

    await expect(
      bookSession({
        sessionId: 's_new',
        tutorId: 't_1',
        studentId: 'st_1',
        startIso: '2026-09-01T09:30:00.000Z',
        endIso: '2026-09-01T10:00:00.000Z',
        isTrial: false,
        nowIso: '2026-09-01T09:00:00.000Z',
      }),
    ).rejects.toThrow(SchedulingConflictError);
  });

  it('rejects a booking while the tutor has paused new bookings', async () => {
    const { availability, sessions } = buildFakes([], { pausedForNewBookings: true });
    const bookSession = makeBookSession({ availability, sessions });

    await expect(
      bookSession({
        sessionId: 's_new',
        tutorId: 't_1',
        studentId: 'st_1',
        startIso: '2026-09-05T10:00:00.000Z',
        endIso: '2026-09-05T10:30:00.000Z',
        isTrial: false,
        nowIso: '2026-09-01T09:00:00.000Z',
      }),
    ).rejects.toThrow(/paused new bookings/);
  });

  it('rejects a booking that falls outside the recurring rules', async () => {
    const sundayOnly: AvailabilityRule[] = [
      { id: 'sun', tutorId: 't_1', weekday: 0, startMinute: 0, endMinute: 1440 },
    ];
    const { availability, sessions } = buildFakes([], {}, [], sundayOnly);
    const bookSession = makeBookSession({ availability, sessions });

    await expect(
      bookSession({
        sessionId: 's_new',
        tutorId: 't_1',
        studentId: 'st_1',
        // 2026-09-02 is a Wednesday; only Sunday is available.
        startIso: '2026-09-02T10:00:00.000Z',
        endIso: '2026-09-02T10:30:00.000Z',
        isTrial: false,
        nowIso: '2026-09-01T09:00:00.000Z',
      }),
    ).rejects.toThrow(/falls outside the tutor's availability/);
  });

  it('rejects a booking blocked by a blocked exception in the tutor timezone', async () => {
    const blocked: AvailabilityException[] = [
      {
        id: 'x1',
        tutorId: 't_1',
        date: '2026-09-02',
        kind: 'blocked',
        startMinute: 11 * 60,
        endMinute: 12 * 60,
      },
    ];
    const { availability, sessions } = buildFakes([], {}, blocked);
    const bookSession = makeBookSession({ availability, sessions });

    await expect(
      bookSession({
        sessionId: 's_new',
        tutorId: 't_1',
        studentId: 'st_1',
        // 10:00Z in Africa/Lagos is 11:00 local — inside the blocked window.
        startIso: '2026-09-02T10:00:00.000Z',
        endIso: '2026-09-02T10:30:00.000Z',
        isTrial: false,
        nowIso: '2026-09-01T09:00:00.000Z',
      }),
    ).rejects.toThrow(/blocked by an exception/);
  });

  it('accepts a booking on an extra exception outside the recurring rules', async () => {
    const extra: AvailabilityException[] = [
      {
        id: 'x2',
        tutorId: 't_1',
        date: '2026-09-02',
        kind: 'extra',
        startMinute: 10 * 60,
        endMinute: 13 * 60,
      },
    ];
    const { availability, sessions, saved } = buildFakes([], {}, extra, []);
    const bookSession = makeBookSession({ availability, sessions });

    const result = await bookSession({
      sessionId: 's_new',
      tutorId: 't_1',
      studentId: 'st_1',
      startIso: '2026-09-02T11:00:00.000Z',
      endIso: '2026-09-02T11:30:00.000Z',
      isTrial: false,
      nowIso: '2026-09-01T09:00:00.000Z',
    });

    expect(result.status).toBe('booked');
    expect(saved).toHaveLength(1);
  });

  it('judges exceptions in the tutor timezone, not UTC', async () => {
    const blocked: AvailabilityException[] = [
      {
        id: 'x3',
        tutorId: 't_1',
        date: '2026-09-02',
        kind: 'blocked',
        startMinute: 10 * 60,
        endMinute: 10 * 60 + 30,
      },
    ];

    // Same UTC instant: blocked at 10:00 local in UTC, but 10:00Z in Lagos is
    // 11:00 local — so the block only refuses the UTC tutor.
    const lagos = buildFakes([], { timezone: 'Africa/Lagos' }, blocked);
    const utc = buildFakes([], { timezone: 'UTC' }, blocked);
    const input = {
      sessionId: 's_new',
      tutorId: 't_1',
      studentId: 'st_1',
      startIso: '2026-09-02T10:00:00.000Z',
      endIso: '2026-09-02T10:30:00.000Z',
      isTrial: false,
      nowIso: '2026-09-01T09:00:00.000Z',
    };

    await expect(makeBookSession(utc)(input)).rejects.toThrow(/blocked by an exception/);
    await expect(makeBookSession(lagos)(input)).resolves.toMatchObject({ status: 'booked' });
  });
});
