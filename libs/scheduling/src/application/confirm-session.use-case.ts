import type { SessionRepository } from '../domain/scheduling.ports';

export interface ConfirmSessionInput {
  sessionId: string;
  tutorId: string;
  nowIso: string;
}

export class ConfirmSessionNotFoundError extends Error {
  constructor(id: string) {
    super(`No session found for id ${id}.`);
  }
}

export class SessionNotBookedError extends Error {
  constructor(id: string, status: string) {
    super(`Session ${id} is ${status}; only booked sessions can be started.`);
  }
}

/**
 * The tutor starts the lesson: a booked session becomes confirmed, which is
 * what unlocks the lab for both participants and (later, via delivery
 * confirmation) the payout path. Confirmation is timestamped into
 * statusHistory the same way booking and cancellation are.
 */
export function makeConfirmSession(deps: { sessions: SessionRepository }) {
  return async function confirmSession(input: ConfirmSessionInput): Promise<void> {
    const session = await deps.sessions.findById(input.sessionId);
    if (!session) throw new ConfirmSessionNotFoundError(input.sessionId);
    if (session.tutorId !== input.tutorId)
      throw new SessionNotBookedError(input.sessionId, 'mismatched tutor');
    if (session.status !== 'booked')
      throw new SessionNotBookedError(input.sessionId, session.status);

    await deps.sessions.save({
      ...session,
      status: 'confirmed',
      statusHistory: [...session.statusHistory, { status: 'confirmed', at: input.nowIso }],
    });
  };
}
