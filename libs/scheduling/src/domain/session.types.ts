export type SessionStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface ScheduledSession {
  readonly id: string;
  readonly tutorId: string;
  readonly studentId: string;
  readonly startIso: string; // UTC
  readonly endIso: string; // UTC
  readonly status: SessionStatus;
  readonly isTrial: boolean;
  /** Group lab membership — null for one-on-one sessions. */
  readonly groupId: string | null;
  /**
   * Group size snapshot used for group pricing. Set to the live member count
   * (including this booking) at enroll time, backfilled to the final locked
   * size on lock. Null for one-on-one sessions.
   */
  readonly groupSize: number | null;
  readonly statusHistory: readonly { status: SessionStatus; at: string }[];
}
