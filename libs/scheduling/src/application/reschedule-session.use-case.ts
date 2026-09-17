import { eventBus } from '@mojo/shared/events';
import { fitsAvailability, tutorLocalTime } from '../domain/availability-validation';
import { hasConflict, respectsBuffer, withinNoticeWindow } from '../domain/conflict-detection';
import type { AvailabilityRepository, SessionRepository } from '../domain/scheduling.ports';
import type { ScheduledSession } from '../domain/session.types';
import { SchedulingConflictError } from './book-session.use-case';
import { SessionNotFoundError } from './cancel-session.use-case';

export interface RescheduleSessionInput {
  sessionId: string;
  newStartIso: string;
  newEndIso: string;
  nowIso: string;
}

/**
 * Moves a booking to a new slot in place — same session id, same charge.
 * The student price is locked at booking time (roadmap Phase 0), so a move
 * never re-prices: the original `StudentCharge` still settles the session.
 * The new slot re-validates through the same engine as booking (notice,
 * availability, conflicts, buffer), excluding the session itself so a small
 * shift that still overlaps the old time is allowed.
 */
export function makeRescheduleSession(deps: {
  availability: AvailabilityRepository;
  sessions: SessionRepository;
}) {
  return async function rescheduleSession(
    input: RescheduleSessionInput,
  ): Promise<ScheduledSession> {
    const session = await deps.sessions.findById(input.sessionId);
    if (!session) throw new SessionNotFoundError(input.sessionId);
    if (session.status !== 'booked' && session.status !== 'confirmed') {
      throw new SchedulingConflictError('only booked or confirmed sessions can be rescheduled.');
    }
    if (Date.parse(input.newEndIso) <= Date.parse(input.newStartIso)) {
      throw new SchedulingConflictError('the new slot ends before it starts.');
    }

    const settings = await deps.availability.getSettings(session.tutorId);
    if (settings.pausedForNewBookings) {
      throw new SchedulingConflictError('this tutor has paused new bookings.');
    }
    if (!withinNoticeWindow(input.newStartIso, input.nowIso, settings.minimumNoticeMinutes)) {
      throw new SchedulingConflictError(
        `must be booked at least ${settings.minimumNoticeMinutes} minutes ahead.`,
      );
    }

    const localStart = tutorLocalTime(input.newStartIso, settings.timezone);
    const [rules, exceptions] = await Promise.all([
      deps.availability.getRules(session.tutorId),
      deps.availability.getExceptions(session.tutorId, localStart.dateKey),
    ]);
    const candidate = { startIso: input.newStartIso, endIso: input.newEndIso };
    if (!fitsAvailability(candidate, settings.timezone, rules, exceptions)) {
      throw new SchedulingConflictError(
        "falls outside the tutor's availability or is blocked by an exception.",
      );
    }

    const existing = (
      await deps.sessions.getBookedSessions(
        session.tutorId,
        input.newStartIso,
        input.newEndIso,
      )
    ).filter((s) => s.id !== session.id);

    if (hasConflict(candidate, existing)) {
      throw new SchedulingConflictError('overlaps an existing session.');
    }
    if (!respectsBuffer(candidate, existing, settings.bufferMinutes)) {
      throw new SchedulingConflictError(
        `does not respect the ${settings.bufferMinutes}-minute buffer.`,
      );
    }

    const moved: ScheduledSession = {
      ...session,
      startIso: input.newStartIso,
      endIso: input.newEndIso,
    };
    await deps.sessions.save(moved);

    await eventBus.publish({
      name: 'SessionRescheduled',
      occurredAt: input.nowIso,
      payload: {
        sessionId: session.id,
        tutorId: session.tutorId,
        studentId: session.studentId,
        oldStartIso: session.startIso,
        oldEndIso: session.endIso,
        newStartIso: input.newStartIso,
        newEndIso: input.newEndIso,
      },
    });

    return moved;
  };
}
