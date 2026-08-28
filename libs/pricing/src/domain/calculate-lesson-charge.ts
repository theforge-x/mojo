import { type Money, money, percentOf, subtractMoney } from '@mojo/shared/domain';
import type { CommissionSplit, SegmentRate } from './pricing.types';

/**
 * Pure domain logic — the roadmap's Phase 2 monetization model, as code.
 * No I/O. This is what makes the entire commission model unit-testable
 * without a database.
 */
export function calculateLessonCharge(
  segments: number,
  rate: SegmentRate,
  takeHomePercent: number,
): CommissionSplit {
  const total = money(segments * rate.perSegment.amountMinor, rate.perSegment.currency);
  const tutorTakeHome = percentOf(total, takeHomePercent);
  const platformCommission = subtractMoney(total, tutorTakeHome);
  return { total, tutorTakeHome, platformCommission };
}

/** The trial lesson bypasses take-home entirely — the tutor always earns 0. */
export function calculateTrialLessonCharge(segments: number, rate: SegmentRate): CommissionSplit {
  const total = money(segments * rate.perSegment.amountMinor, rate.perSegment.currency);
  const zero: Money = money(0, rate.perSegment.currency);
  return { total, tutorTakeHome: zero, platformCommission: total };
}

export function effectiveTakeHomePercent(basePercent: number, hasMojoPlus: boolean): number {
  return hasMojoPlus ? basePercent + 10 : basePercent;
}
