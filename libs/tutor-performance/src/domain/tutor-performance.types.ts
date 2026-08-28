import type { TutorLevel } from '@mojo/shared/domain';

export interface TutorPerformance {
  readonly tutorId: string;
  readonly level: TutorLevel;
  readonly cumulativeHoursTaught: number;
  readonly responseTimeMinutesAvg: number;
  readonly trialToPaidConversionRate: number; // 0..1
  readonly cancellationRate: number; // 0..1
  readonly averageRating: number; // 0..5
}

/** Illustrative starting thresholds from the roadmap — not final. */
export const LEVEL_THRESHOLDS: Record<
  Exclude<TutorLevel, 'entry'>,
  { hours: number; minRating: number }
> = {
  established: { hours: 50, minRating: 4.5 },
  expert: { hours: 200, minRating: 4.7 },
};
