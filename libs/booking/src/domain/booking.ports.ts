import type { ScheduledSession } from '@mojo/scheduling/domain';
import type { DeliveryConfirmation } from './session-lifecycle.types';

export interface BookingRepository {
  findById(sessionId: string): Promise<ScheduledSession | null>;
  markCompleted(sessionId: string, at: string): Promise<void>;
  markNoShow(sessionId: string, by: 'student' | 'tutor', at: string): Promise<void>;
  saveConfirmation(confirmation: DeliveryConfirmation): Promise<void>;
}
