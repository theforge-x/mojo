import { eventBus } from '@mojo/shared/events';
import type { BookingRepository } from '../domain/booking.ports';
import { SessionNotBookedError } from './confirm-delivery.use-case';

export interface MarkNoShowInput {
  sessionId: string;
  by: 'student' | 'tutor';
  nowIso: string;
}

/** Records a no-show (tutor marks an absent student or vice versa). */
export function makeMarkNoShow(deps: { bookings: BookingRepository }) {
  return async function markNoShow(input: MarkNoShowInput): Promise<void> {
    const session = await deps.bookings.findById(input.sessionId);
    if (!session) throw new SessionNotBookedError(input.sessionId);

    await deps.bookings.markNoShow(input.sessionId, input.by, input.nowIso);
    await eventBus.publish({
      name: 'SessionNoShow',
      occurredAt: input.nowIso,
      payload: { sessionId: session.id, noShowBy: input.by },
    });
  };
}
