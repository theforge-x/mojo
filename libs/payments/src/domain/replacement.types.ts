export type ReplacementGrantStatus = 'granted' | 'redeemed';

/**
 * A free-replacement entitlement: when a trial lesson is cancelled, the
 * student banks one free rebook with the same tutor. Single-use by
 * construction — redeeming flips the grant to `redeemed`, and a redeemed
 * session can never mint a follow-up grant, so the chain always ends.
 */
export interface ReplacementGrant {
  readonly id: string;
  readonly studentId: string;
  readonly tutorId: string;
  readonly sourceSessionId: string;
  readonly status: ReplacementGrantStatus;
  readonly createdAt: string;
  readonly redeemedSessionId: string | null;
  readonly redeemedAt: string | null;
}
