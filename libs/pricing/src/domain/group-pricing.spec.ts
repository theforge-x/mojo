import { money } from '@mojo/shared/domain';
import { describe, expect, it } from 'vitest';
import {
  calculateGroupLessonCharge,
  GROUP_FLOOR_MINOR,
  groupPerSegmentMinor,
  groupPriceMultiplier,
  InvalidGroupSizeError,
} from './group-pricing';

const RATE = { level: 'established' as const, perSegment: money(600_000, 'NGN'), isCustom: false };

describe('groupPriceMultiplier', () => {
  it.each([
    [1, 1],
    [10, 1],
    [11, 0.9],
    [20, 0.9],
    [21, 0.81],
    [31, 0.729],
  ])('size %i -> multiplier %f', (size, expected) => {
    expect(groupPriceMultiplier(size)).toBeCloseTo(expected, 10);
  });

  it('rejects non-positive and fractional sizes', () => {
    expect(() => groupPriceMultiplier(0)).toThrow(InvalidGroupSizeError);
    expect(() => groupPriceMultiplier(2.5)).toThrow(InvalidGroupSizeError);
  });
});

describe('groupPerSegmentMinor', () => {
  it('charges full price for the first block of ten', () => {
    expect(groupPerSegmentMinor(600_000, 'NGN', 1)).toBe(600_000);
    expect(groupPerSegmentMinor(600_000, 'NGN', 10)).toBe(600_000);
  });

  it('compounds 10% off per further block of ten', () => {
    expect(groupPerSegmentMinor(600_000, 'NGN', 11)).toBe(540_000);
    expect(groupPerSegmentMinor(600_000, 'NGN', 21)).toBe(486_000);
  });

  it('never prices below the currency floor', () => {
    expect(groupPerSegmentMinor(600_000, 'NGN', 10_000)).toBe(GROUP_FLOOR_MINOR.NGN);
    expect(groupPerSegmentMinor(100, 'USD', 10_000)).toBe(GROUP_FLOOR_MINOR.USD);
  });
});

describe('calculateGroupLessonCharge', () => {
  it('matches one-on-one math for a group of one', () => {
    const split = calculateGroupLessonCharge(4, RATE, 60, 1);
    expect(split.perStudent.amountMinor).toBe(2_400_000);
    expect(split.total.amountMinor).toBe(2_400_000);
    expect(split.tutorTakeHome.amountMinor).toBe(1_440_000);
    expect(split.platformCommission.amountMinor).toBe(960_000);
  });

  it('scales tutor take-home with the collected pot while students pay less', () => {
    const split = calculateGroupLessonCharge(4, RATE, 60, 20);
    // 20 students: one 10% step -> 540k/segment each.
    expect(split.perSegmentMinor).toBe(540_000);
    expect(split.perStudent.amountMinor).toBe(2_160_000);
    expect(split.total.amountMinor).toBe(43_200_000);
    expect(split.tutorTakeHome.amountMinor).toBe(25_920_000);
    expect(split.platformCommission.amountMinor).toBe(17_280_000);
  });
});
