import type { BookingSession } from './booking-session.types';
import type { DeliveryConfirmation } from './session-lifecycle.types';

export interface BookingRepository {
  findById(sessionId: string): Promise<BookingSession | null>;
  /**
   * Sessions stuck in `confirmed` whose end is before `endBeforeIso` — the
   * auto-confirm worker's intake. Never includes already-completed sessions,
   * so a run can never double-credit a tutor's wallet.
   */
  listAwaitingConfirmation(endBeforeIso: string): Promise<BookingSession[]>;
  markCompleted(sessionId: string, at: string): Promise<void>;
  markNoShow(sessionId: string, by: 'student' | 'tutor', nowIso: string): Promise<void>;
  saveConfirmation(confirmation: DeliveryConfirmation): Promise<void>;
}

/**
 * Per-segment rate for a tutor in minor units. Lives in booking's domain so
 * the use-case never hardcodes a price and never reaches into pricing's
 * module — the composition root implements it from the pricing reader.
 */
export interface SegmentRateReader {
  perSegmentMinor(tutorId: string): Promise<number>;
}
