import { eventBus } from '@mojo/shared/events';
import type { SessionRepository } from '../domain/scheduling.ports';

export interface CancelSessionInput {
  sessionId: string;
  cancelledBy: 'student' | 'tutor' | 'admin';
  withinNoticeWindow: boolean;
  nowIso: string;
}

export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Session ${id} does not exist.`);
  }
}

export function makeCancelSession(deps: { sessions: SessionRepository }) {
  return async function cancelSession(input: CancelSessionInput): Promise<void> {
    const session = await deps.sessions.findById(input.sessionId);
    if (!session) throw new SessionNotFoundError(input.sessionId);

    await deps.sessions.save({
      ...session,
      status: 'cancelled',
      statusHistory: [...session.statusHistory, { status: 'cancelled', at: input.nowIso }],
    });

    await eventBus.publish({
      name: 'SessionCancelled',
      occurredAt: input.nowIso,
      payload: {
        sessionId: input.sessionId,
        cancelledBy: input.cancelledBy,
        withinNoticeWindow: input.withinNoticeWindow,
      },
    });
  };
}
