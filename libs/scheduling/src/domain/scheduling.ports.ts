import type { AvailabilityException, AvailabilityRule, SchedulingSettings } from './availability.types';
import type { ScheduledSession } from './session.types';

export interface AvailabilityRepository {
  getRules(tutorId: string): Promise<AvailabilityRule[]>;
  getExceptions(tutorId: string, date: string): Promise<AvailabilityException[]>;
  getSettings(tutorId: string): Promise<SchedulingSettings>;
}

export interface SessionRepository {
  getBookedSessions(tutorId: string, rangeStartIso: string, rangeEndIso: string): Promise<ScheduledSession[]>;
  save(session: ScheduledSession): Promise<void>;
  findById(id: string): Promise<ScheduledSession | null>;
}
