import { eventBus } from '@mojo/shared/events';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AvailabilityRepository, SchedulingSettings, SessionRepository } from '../domain';
import type { ScheduledSession } from '../domain/session.types';
import { makeBookSession, SchedulingConflictError } from './book-session.use-case';

function buildFakes(
  existing: ScheduledSession[],
  settingsOverride: Partial<SchedulingSettings> = {},
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
    getRules: async () => [],
    getExceptions: async () => [],
    getSettings: async () => settings,
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
});
