import { describe, expect, it } from 'vitest';
import type { SessionRepository } from '../domain/scheduling.ports';
import {
  type ConfirmSessionInput,
  ConfirmSessionNotFoundError,
  makeConfirmSession,
  SessionNotBookedError,
} from './confirm-session.use-case';

function fakeSessions(initial: { status: string; tutorId: string }): SessionRepository {
  let session = {
    id: 's_1',
    tutorId: 't_1',
    studentId: 'st_1',
    startIso: '2026-01-02T09:00:00.000Z',
    endIso: '2026-01-02T10:00:00.000Z',
    status: initial.status as never,
    isTrial: false,
    statusHistory: [] as never,
    ...initial,
  };
  const base = {
    getBookedSessions: async () => [],
    findById: async (id: string) => (id === session.id ? session : null),
    save: async (next: never) => {
      session = next;
    },
  };
  return { ...base, session: { get: () => session } } as unknown as SessionRepository;
}

describe('makeConfirmSession', () => {
  it('moves a booked session to confirmed and timestamps history', async () => {
    const sessions = fakeSessions({ status: 'booked', tutorId: 't_1' }) as SessionRepository & {
      session: { get: () => { status: string; statusHistory: unknown[] } };
    };
    const confirmSession = makeConfirmSession({ sessions });

    await confirmSession({
      sessionId: 's_1',
      tutorId: 't_1',
      nowIso: '2026-01-02T08:00:00.000Z',
    } satisfies ConfirmSessionInput);

    const after = sessions.session.get();
    expect(after.status).toBe('confirmed');
    expect(after.statusHistory).toHaveLength(1);
    expect(after.statusHistory[0]).toEqual({ status: 'confirmed', at: '2026-01-02T08:00:00.000Z' });
  });

  it('rejects a session that is not booked', async () => {
    const sessions = fakeSessions({ status: 'cancelled', tutorId: 't_1' });
    const confirmSession = makeConfirmSession({ sessions });

    await expect(
      confirmSession({ sessionId: 's_1', tutorId: 't_1', nowIso: '2026-01-02T08:00:00.000Z' }),
    ).rejects.toBeInstanceOf(SessionNotBookedError);
  });

  it('rejects a session owned by another tutor', async () => {
    const sessions = fakeSessions({ status: 'booked', tutorId: 't_2' });
    const confirmSession = makeConfirmSession({ sessions });

    await expect(
      confirmSession({ sessionId: 's_1', tutorId: 't_1', nowIso: '2026-01-02T08:00:00.000Z' }),
    ).rejects.toBeInstanceOf(SessionNotBookedError);
  });

  it('rejects an unknown session', async () => {
    const sessions = fakeSessions({ status: 'booked', tutorId: 't_1' });
    const confirmSession = makeConfirmSession({ sessions });

    await expect(
      confirmSession({ sessionId: 'nope', tutorId: 't_1', nowIso: '2026-01-02T08:00:00.000Z' }),
    ).rejects.toBeInstanceOf(ConfirmSessionNotFoundError);
  });
});
