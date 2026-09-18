import type {
  AvailabilityException,
  AvailabilityRule,
  SchedulingSettings,
} from './availability.types';
import type { GroupLab } from './group-lab.types';
import type { ScheduledSession } from './session.types';

export interface AvailabilityRepository {
  getRules(tutorId: string): Promise<AvailabilityRule[]>;
  saveRules(rules: AvailabilityRule[]): Promise<void>;
  getExceptions(tutorId: string, date: string): Promise<AvailabilityException[]>;
  listExceptions(
    tutorId: string,
    fromDate: string,
    toDate: string,
  ): Promise<AvailabilityException[]>;
  saveExceptions(tutorId: string, date: string, exceptions: AvailabilityException[]): Promise<void>;
  getSettings(tutorId: string): Promise<SchedulingSettings>;
  saveSettings(settings: SchedulingSettings): Promise<void>;
}

export interface SessionRepository {
  getBookedSessions(
    tutorId: string,
    rangeStartIso: string,
    rangeEndIso: string,
  ): Promise<ScheduledSession[]>;
  save(session: ScheduledSession): Promise<void>;
  findById(id: string): Promise<ScheduledSession | null>;
  listByGroup(groupId: string): Promise<ScheduledSession[]>;
}

export interface GroupLabRepository {
  findById(groupId: string): Promise<GroupLab | null>;
  listByTutor(tutorId: string): Promise<GroupLab[]>;
  save(group: GroupLab): Promise<void>;
}
