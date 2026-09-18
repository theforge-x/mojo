import type { Money, TutorLevel } from '@mojo/shared/domain';

/**
 * Trial pricing policy, as code. The roadmap prices the first lesson at a
 * reduced, platform-subsidized rate while the tutor's take-home stays ₦0
 * (enforced at completion in `@mojo/pricing`). 50% of the standard total is
 * the starting point — tune the number, not the shape.
 */
export const TRIAL_PRICE_PERCENT = 50;

/**
 * `pending` — redirect/initialize flow created the row, money hasn't moved
 * yet. `failed` — the rail declined or the window was abandoned. Only
 * captured-family rows ever represent moved money.
 */
export type ChargeStatus = 'pending' | 'failed' | 'captured' | 'partially_refunded' | 'refunded';

export interface StudentCharge {
  readonly id: string;
  readonly studentId: string;
  readonly tutorId: string;
  readonly sessionId: string;
  readonly segments: number;
  readonly perSegmentMinor: number;
  readonly standardTotalMinor: number;
  /** Standard total minus what the student actually paid (0 for full-price). */
  readonly trialDiscountMinor: number;
  readonly totalMinor: number;
  readonly currency: Money['currency'];
  readonly isTrial: boolean;
  readonly level: TutorLevel;
  readonly isCustomRate: boolean;
  readonly paymentMethodId: string;
  readonly status: ChargeStatus;
  /** Paystack transaction reference (`mojo_<chargeId>`) — the webhook key. */
  readonly providerReference: string | null;
  readonly createdAt: string;
}

export type RefundReason = 'cancelled' | 'dispute' | 'no_show' | 'goodwill';

export interface ChargeRefund {
  readonly id: string;
  readonly chargeId: string;
  readonly studentId: string;
  readonly amountMinor: number;
  readonly currency: Money['currency'];
  readonly reason: RefundReason;
  readonly createdAt: string;
}

/** Booking-time price breakdown shown at checkout before anything is charged. */
export interface ChargeQuote {
  readonly tutorId: string;
  readonly segments: number;
  readonly perSegmentMinor: number;
  readonly currency: Money['currency'];
  readonly isTrial: boolean;
  readonly level: TutorLevel;
  readonly isCustomRate: boolean;
  readonly standardTotalMinor: number;
  readonly trialDiscountMinor: number;
  readonly totalMinor: number;
}
