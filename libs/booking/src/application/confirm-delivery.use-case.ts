import { eventBus } from '@mojo/shared/events';
import { segmentsBetween } from '@mojo/shared/util';
import type { BookingRepository, SegmentRateReader } from '../domain/booking.ports';

export interface ConfirmDeliveryInput {
  sessionId: string;
  confirmedBy: 'student' | 'tutor' | 'auto_window';
  nowIso: string;
}

export class SessionNotBookedError extends Error {
  constructor(id: string) {
    super(`No session found for id ${id}.`);
  }
}

export class SessionAlreadyCompletedError extends Error {
  constructor(id: string) {
    super(`Session ${id} is already completed — confirming twice would double-pay the tutor.`);
  }
}

/**
 * This is the action the permissions matrix flags as financial, not just
 * scheduling — confirming delivery is what makes `payments` eligible to
 * release a payout. See `session.confirm_delivery` in the permissions doc.
 *
 * The completed rate comes from the injected `SegmentRateReader` (wired to
 * pricing at the composition root). Trials publish a zero rate, which is
 * how downstream `recordSessionCompletion` detects the trial lesson.
 */
export function makeConfirmDelivery(deps: {
  bookings: BookingRepository;
  rates: SegmentRateReader;
}) {
  return async function confirmDelivery(input: ConfirmDeliveryInput): Promise<void> {
    const session = await deps.bookings.findById(input.sessionId);
    if (!session) throw new SessionNotBookedError(input.sessionId);
    if (session.status === 'completed') throw new SessionAlreadyCompletedError(input.sessionId);

    await deps.bookings.markCompleted(input.sessionId, input.nowIso);
    await deps.bookings.saveConfirmation({
      sessionId: input.sessionId,
      confirmedBy: input.confirmedBy,
      confirmedAt: input.nowIso,
    });

    const segmentCount = segmentsBetween(session.startIso, session.endIso);
    const amountMinor = session.isTrial
      ? 0
      : await deps.rates.perSegmentMinor(session.tutorId, session.groupSize ?? undefined);

    await eventBus.publish({
      name: 'SessionCompleted',
      occurredAt: input.nowIso,
      payload: {
        sessionId: session.id,
        tutorId: session.tutorId,
        studentId: session.studentId,
        segmentCount,
        rate: { amountMinor, currency: 'NGN' },
      },
    });

    await eventBus.publish({
      name: 'SessionDeliveryConfirmed',
      occurredAt: input.nowIso,
      payload: { sessionId: session.id, confirmedBy: input.confirmedBy },
    });
  };
}
