import type { Money, TutorLevel } from '@mojo/shared/domain';

export type { TutorLevel };

export interface SegmentRate {
  readonly level: TutorLevel;
  readonly perSegment: Money;
  readonly isCustom: boolean; // true only when set via Mojo+
}

export interface CommissionSplit {
  readonly total: Money;
  readonly tutorTakeHome: Money;
  readonly platformCommission: Money;
}

export const BASE_TAKE_HOME_PERCENT: Record<TutorLevel, number> = {
  entry: 50,
  established: 60,
  expert: 70,
};

export const MOJO_PLUS_BONUS_PERCENT = 10;

export const DEFAULT_SEGMENT_RATE_NGN: Record<TutorLevel, number> = {
  entry: 400_000, // ₦4,000 in kobo
  established: 600_000,
  expert: 800_000,
};
