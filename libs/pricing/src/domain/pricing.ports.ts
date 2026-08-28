import type { TutorLevel } from './pricing.types';

export interface TutorLevelReader {
  getLevel(tutorId: string): Promise<TutorLevel>;
  hasMojoPlus(tutorId: string): Promise<boolean>;
  getCustomRateMinor(tutorId: string): Promise<number | null>;
}
