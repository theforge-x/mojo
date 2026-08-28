import { describe, expect, it } from 'vitest';
import { money } from '@mojo/shared/domain';
import {
  calculateLessonCharge,
  calculateTrialLessonCharge,
  effectiveTakeHomePercent,
} from './calculate-lesson-charge';
import { BASE_TAKE_HOME_PERCENT, DEFAULT_SEGMENT_RATE_NGN } from './pricing.types';
import type { SegmentRate } from './pricing.types';

const establishedRate: SegmentRate = {
  level: 'established',
  perSegment: money(DEFAULT_SEGMENT_RATE_NGN.established, 'NGN'),
  isCustom: false,
};

describe('calculateLessonCharge', () => {
  it('splits a 60-minute (4-segment) Established lesson at 60% take-home', () => {
    const takeHome = effectiveTakeHomePercent(BASE_TAKE_HOME_PERCENT.established, false);
    const result = calculateLessonCharge(4, establishedRate, takeHome);

    expect(result.total).toEqual(money(2_400_000, 'NGN')); // ₦24,000
    expect(result.tutorTakeHome).toEqual(money(1_440_000, 'NGN')); // ₦14,400
    expect(result.platformCommission).toEqual(money(960_000, 'NGN')); // ₦9,600
  });

  it('gives the Mojo+ bonus a full 10 points on top of the base rate', () => {
    const takeHome = effectiveTakeHomePercent(BASE_TAKE_HOME_PERCENT.established, true);
    const result = calculateLessonCharge(4, establishedRate, takeHome);

    expect(takeHome).toBe(70);
    expect(result.tutorTakeHome).toEqual(money(1_680_000, 'NGN')); // ₦16,800
  });

  it('total + platformCommission always reconstitutes to the tutor take-home', () => {
    const result = calculateLessonCharge(3, establishedRate, 60);
    expect(result.tutorTakeHome.amountMinor + result.platformCommission.amountMinor).toBe(
      result.total.amountMinor,
    );
  });
});

describe('calculateTrialLessonCharge', () => {
  it('always pays the tutor exactly ₦0, regardless of level', () => {
    const result = calculateTrialLessonCharge(2, establishedRate);
    expect(result.tutorTakeHome).toEqual(money(0, 'NGN'));
    expect(result.platformCommission).toEqual(result.total);
  });
});

describe('effectiveTakeHomePercent', () => {
  it.each([
    ['entry', false, 50],
    ['entry', true, 60],
    ['established', false, 60],
    ['established', true, 70],
    ['expert', false, 70],
    ['expert', true, 80],
  ] as const)('%s level, mojoPlus=%s → %i%%', (level, hasMojoPlus, expected) => {
    expect(effectiveTakeHomePercent(BASE_TAKE_HOME_PERCENT[level], hasMojoPlus)).toBe(expected);
  });
});
