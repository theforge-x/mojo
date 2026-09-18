import { eventBus } from '@mojo/shared/events';
import { fitsAvailability, tutorLocalTime } from '../domain/availability-validation';
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
  /** Group lab enrollment — the row joins this group at the given live size. */
  groupId?: string;
  groupSize?: number;
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

    // The candidate must sit inside the tutor's recurring availability (or an
    // "extra" exception) and must not collide with a "blocked" exception —
    // both are expressed in the tutor's wall-clock, so convert the UTC candidate
    // into the tutor's local weekday/minute before checking.
    const localStart = tutorLocalTime(input.startIso, settings.timezone);
    const [rules, exceptions] = await Promise.all([
      deps.availability.getRules(input.tutorId),
      deps.availability.getExceptions(input.tutorId, localStart.dateKey),
    ]);
    const candidate = { startIso: input.startIso, endIso: input.endIso };
    if (!fitsAvailability(candidate, settings.timezone, rules, exceptions)) {
      throw new SchedulingConflictError(
        "falls outside the tutor's availability or is blocked by an exception.",
      );
    }

    const existing = await deps.sessions.getBookedSessions(
      input.tutorId,
      input.startIso,
      input.endIso,
    );

    // Members of the same group lab share one event — they neither conflict
    // with nor buffer against each other, only against everything else.
    const others =
      input.groupId !== undefined
        ? existing.filter((s) => s.groupId !== input.groupId)
        : existing;

    if (hasConflict(candidate, others)) {
      throw new SchedulingConflictError('overlaps an existing session.');
    }
    if (!respectsBuffer(candidate, others, settings.bufferMinutes)) {
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
      groupId: input.groupId ?? null,
      groupSize: input.groupSize ?? null,
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
