export type SessionStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface ScheduledSession {
  readonly id: string;
  readonly tutorId: string;
  readonly studentId: string;
  readonly startIso: string; // UTC
  readonly endIso: string; // UTC
  readonly status: SessionStatus;
  readonly isTrial: boolean;
  readonly statusHistory: readonly { status: SessionStatus; at: string }[];
}
