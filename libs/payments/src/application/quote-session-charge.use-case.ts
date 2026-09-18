import { money, percentOf, type TutorLevel } from '@mojo/shared/domain';
import { segmentsBetween } from '@mojo/shared/util';
import { type ChargeQuote, TRIAL_PRICE_PERCENT } from '../domain/charge.types';
import type { ChargeRateReader } from '../domain/payments.ports';

export interface QuoteSessionChargeInput {
  tutorId: string;
  startIso: string;
  endIso: string;
  isTrial: boolean;
  /** Group lab size — per-student price follows the ladder. Omit for 1-on-1. */
  groupSize?: number;
}

/**
 * Booking-time price breakdown: segments × the tutor's current rate, with
 * the trial price applied up front so the discount is visible at checkout.
 * Pure quote — records nothing. The caller is expected to pass the same
 * inputs straight into `chargeStudent` so the charged amount matches.
 */
export function makeQuoteSessionCharge(deps: {
  rates: ChargeRateReader;
  defaults: Record<TutorLevel, number>;
}) {
  return async function quoteSessionCharge(input: QuoteSessionChargeInput): Promise<ChargeQuote> {
    // The student-facing total depends only on the rate card — the
    // take-home split (level base + Mojo+ bonus) settles the tutor's side
    // at completion and never changes what the student pays.
    const [level, customRateMinor] = await Promise.all([
      deps.rates.getLevel(input.tutorId),
      deps.rates.getCustomRateMinor(input.tutorId),
    ]);
    const perSegmentMinor =
      input.groupSize !== undefined && input.groupSize > 1
        ? await deps.rates.groupPerSegmentMinor(input.tutorId, input.groupSize)
        : (customRateMinor ?? deps.defaults[level]);
    const segments = segmentsBetween(input.startIso, input.endIso);
    const standard = money(segments * perSegmentMinor, 'NGN');
    const total = input.isTrial ? percentOf(standard, TRIAL_PRICE_PERCENT) : standard;
    return {
      tutorId: input.tutorId,
      segments,
      perSegmentMinor,
      currency: 'NGN',
      isTrial: input.isTrial,
      level,
      isCustomRate: customRateMinor !== null,
      standardTotalMinor: standard.amountMinor,
      trialDiscountMinor: standard.amountMinor - total.amountMinor,
      totalMinor: total.amountMinor,
    };
  };
}
