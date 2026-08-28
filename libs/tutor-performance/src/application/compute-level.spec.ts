import { describe, expect, it } from 'vitest';
import type { TutorPerformance } from '../domain/tutor-performance.types';
import { computeLevel } from './recompute-level.use-case';

function perf(overrides: Partial<TutorPerformance> = {}): TutorPerformance {
  return {
    tutorId: 't_1',
    level: 'entry',
    cumulativeHoursTaught: 0,
    responseTimeMinutesAvg: 120,
    trialToPaidConversionRate: 0.1,
    cancellationRate: 0.05,
    averageRating: 0,
    ...overrides,
  };
}

describe('computeLevel', () => {
  it('starts at entry with no hours or rating', () => {
    expect(computeLevel(perf())).toBe('entry');
  });

  it('does not promote on hours alone when the rating floor is unmet', () => {
    expect(
      computeLevel(perf({ cumulativeHoursTaught: 60, averageRating: 4.0 })),
    ).toBe('entry');
  });

  it('promotes to established at 50 hours with a 4.5+ rating', () => {
    expect(
      computeLevel(perf({ cumulativeHoursTaught: 50, averageRating: 4.5 })),
    ).toBe('established');
  });

  it('requires the expert hours and rating floor (200h / 4.7)', () => {
    expect(
      computeLevel(perf({ cumulativeHoursTaught: 200, averageRating: 4.7 })),
    ).toBe('expert');
  });

  it('stays established if expert rating is met but expert hours are not', () => {
    expect(
      computeLevel(perf({ cumulativeHoursTaught: 100, averageRating: 4.9 })),
    ).toBe('established');
  });
});
