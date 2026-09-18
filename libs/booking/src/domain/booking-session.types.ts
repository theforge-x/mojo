/**
 * The shape of a scheduled session as seen by the bookings module.
 *
 * Declared here as booking's own contract (dependency inversion): the
 * scheduling module owns the real entity, but bookings depends only on this
 * stable local contract and never imports scheduling's domain. The mapping
 * between the persistence row and this type lives in booking's infrastructure.
 */
export interface BookingSession {
  readonly id: string;
  readonly tutorId: string;
  readonly studentId: string;
  readonly startIso: string;
  readonly endIso: string;
  readonly isTrial: boolean;
  readonly status: 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  /** Group lab size snapshot — null for one-on-one sessions. */
  readonly groupSize: number | null;
}
