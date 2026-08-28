import { eventBus } from '@mojo/shared/events';
import { segmentsBetween } from '@mojo/shared/util';
import type { BookingRepository } from '../domain/booking.ports';

export interface ConfirmDeliveryInput {
  sessionId: string;
  confirmedBy: 'student' | 'auto_window';
  nowIso: string;
}

export class SessionNotBookedError extends Error {
  constructor(id: string) {
    super(`No session found for id ${id}.`);
  }
}

/**
 * This is the action the permissions matrix flags as financial, not just
 * scheduling — confirming delivery is what makes `payments` eligible to
 * release a payout. See `session.confirm_delivery` in the permissions doc.
 */
export function makeConfirmDelivery(deps: { bookings: BookingRepository }) {
  return async function confirmDelivery(input: ConfirmDeliveryInput): Promise<void> {
    const session = await deps.bookings.findById(input.sessionId);
    if (!session) throw new SessionNotBookedError(input.sessionId);

    await deps.bookings.markCompleted(input.sessionId, input.nowIso);
    await deps.bookings.saveConfirmation({
      sessionId: input.sessionId,
      confirmedBy: input.confirmedBy,
      confirmedAt: input.nowIso,
    });

    const segmentCount = segmentsBetween(session.startIso, session.endIso);

    await eventBus.publish({
      name: 'SessionCompleted',
      occurredAt: input.nowIso,
      payload: {
        sessionId: session.id,
        tutorId: session.tutorId,
        studentId: session.studentId,
        segmentCount,
        rate: { amountMinor: session.isTrial ? 0 : 600_000, currency: 'NGN' },
      },
    });

    await eventBus.publish({
      name: 'SessionDeliveryConfirmed',
      occurredAt: input.nowIso,
      payload: { sessionId: session.id, confirmedBy: input.confirmedBy },
    });
  };
}
