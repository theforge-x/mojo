export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, matching JS Date

export interface AvailabilityRule {
  readonly id: string;
  readonly tutorId: string;
  readonly weekday: Weekday;
  readonly startMinute: number; // minutes since midnight, in the tutor's timezone
  readonly endMinute: number;
}

export type ExceptionKind = 'blocked' | 'extra';

export interface AvailabilityException {
  readonly id: string;
  readonly tutorId: string;
  readonly date: string; // YYYY-MM-DD, in the tutor's timezone
  readonly kind: ExceptionKind;
  readonly startMinute: number;
  readonly endMinute: number;
}

export interface SchedulingSettings {
  readonly tutorId: string;
  readonly timezone: string;
  readonly bufferMinutes: number;
  readonly minimumNoticeMinutes: number;
  readonly pausedForNewBookings: boolean;
}
