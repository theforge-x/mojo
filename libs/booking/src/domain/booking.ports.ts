import type { BookingSession } from './booking-session.types';
import type { DeliveryConfirmation } from './session-lifecycle.types';

export interface BookingRepository {
  findById(sessionId: string): Promise<BookingSession | null>;
  markCompleted(sessionId: string, at: string): Promise<void>;
  markNoShow(sessionId: string, by: 'student' | 'tutor', at: string): Promise<void>;
  saveConfirmation(confirmation: DeliveryConfirmation): Promise<void>;
}
