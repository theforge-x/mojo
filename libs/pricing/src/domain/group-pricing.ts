import { type Money, money, percentOf, subtractMoney } from '@mojo/shared/domain';
import type { CommissionSplit, SegmentRate } from './pricing.types';

export class InvalidGroupSizeError extends Error {
  constructor(groupSize: number) {
    super(`Group size must be a positive integer, got ${groupSize}.`);
  }
}

/** First 10 seats pay full price; every further block of 10 takes another 10% off, compounded. */
export const GROUP_DISCOUNT_BLOCK = 10;
export const GROUP_DISCOUNT_PERCENT = 10;

/** Per-student per-segment floor in minor units — the ladder never prices below this. */
export const GROUP_FLOOR_MINOR: Record<string, number> = {
  NGN: 50_000, // ₦500
  USD: 100, // $1.00
};

export function groupDiscountSteps(groupSize: number): number {
  if (!Number.isInteger(groupSize) || groupSize < 1) throw new InvalidGroupSizeError(groupSize);
  return Math.floor((groupSize - 1) / GROUP_DISCOUNT_BLOCK);
}

export function groupPriceMultiplier(groupSize: number): number {
  return Math.pow(1 - GROUP_DISCOUNT_PERCENT / 100, groupDiscountSteps(groupSize));
}

/** Per-student per-segment price in minor units, floored by currency. */
export function groupPerSegmentMinor(
  baseMinor: number,
  currency: string,
  groupSize: number,
): number {
  const discounted = Math.round(baseMinor * groupPriceMultiplier(groupSize));
  return Math.max(discounted, GROUP_FLOOR_MINOR[currency] ?? 0);
}

export interface GroupCommissionSplit extends CommissionSplit {
  /** What each enrolled student pays in total. */
  readonly perStudent: Money;
  /** Per-student per-segment rate actually charged (post-ladder, post-floor). */
  readonly perSegmentMinor: number;
}

/**
 * Group Lab split. Each student pays the ladder price for the group size;
 * the tutor's take-home percent applies to the whole collected pot, so
 * bigger groups pay the tutor more while each student pays less.
 */
export function calculateGroupLessonCharge(
  segments: number,
  rate: SegmentRate,
  takeHomePercent: number,
  groupSize: number,
): GroupCommissionSplit {
  const perSegmentMinor = groupPerSegmentMinor(
    rate.perSegment.amountMinor,
    rate.perSegment.currency,
    groupSize,
  );
  const perStudent = money(segments * perSegmentMinor, rate.perSegment.currency);
  const total = money(perStudent.amountMinor * groupSize, rate.perSegment.currency);
  const tutorTakeHome = percentOf(total, takeHomePercent);
  const platformCommission = subtractMoney(total, tutorTakeHome);
  return { total, tutorTakeHome, platformCommission, perStudent, perSegmentMinor };
}
