import type { BookingSession } from './booking-session.types';
import type { DeliveryConfirmation } from './session-lifecycle.types';

export interface BookingRepository {
  findById(sessionId: string): Promise<BookingSession | null>;
  markCompleted(sessionId: string, at: string): Promise<void>;
  markNoShow(sessionId: string, by: 'student' | 'tutor', at: string): Promise<void>;
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
