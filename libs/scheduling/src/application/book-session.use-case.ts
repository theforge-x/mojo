import { eventBus } from '@mojo/shared/events';
import { hasConflict, respectsBuffer, withinNoticeWindow } from '../domain/conflict-detection';
import type { AvailabilityRepository, SessionRepository } from '../domain/scheduling.ports';
import type { ScheduledSession } from '../domain/session.types';

export interface BookSessionInput {
  sessionId: string;
  tutorId: string;
  studentId: string;
  startIso: string;
  endIso: string;
  isTrial: boolean;
  nowIso: string;
}

export class SchedulingConflictError extends Error {
  constructor(reason: string) {
    super(`Cannot book this session: ${reason}`);
  }
}

export function makeBookSession(deps: {
  availability: AvailabilityRepository;
  sessions: SessionRepository;
}) {
  return async function bookSession(input: BookSessionInput): Promise<ScheduledSession> {
    const settings = await deps.availability.getSettings(input.tutorId);
    if (settings.pausedForNewBookings) {
      throw new SchedulingConflictError('this tutor has paused new bookings.');
    }

    if (!withinNoticeWindow(input.startIso, input.nowIso, settings.minimumNoticeMinutes)) {
      throw new SchedulingConflictError(
        `must be booked at least ${settings.minimumNoticeMinutes} minutes ahead.`,
      );
    }

    const existing = await deps.sessions.getBookedSessions(
      input.tutorId,
      input.startIso,
      input.endIso,
    );
    const candidate = { startIso: input.startIso, endIso: input.endIso };

    if (hasConflict(candidate, existing)) {
      throw new SchedulingConflictError('overlaps an existing session.');
    }
    if (!respectsBuffer(candidate, existing, settings.bufferMinutes)) {
      throw new SchedulingConflictError(
        `does not respect the ${settings.bufferMinutes}-minute buffer.`,
      );
    }

    const session: ScheduledSession = {
      id: input.sessionId,
      tutorId: input.tutorId,
      studentId: input.studentId,
      startIso: input.startIso,
      endIso: input.endIso,
      status: 'booked',
      isTrial: input.isTrial,
      statusHistory: [{ status: 'booked', at: input.nowIso }],
    };
    await deps.sessions.save(session);

    await eventBus.publish({
      name: 'SessionBooked',
      occurredAt: input.nowIso,
      payload: {
        sessionId: session.id,
        tutorId: session.tutorId,
        studentId: session.studentId,
        isTrial: session.isTrial,
      },
    });

    return session;
  };
}
