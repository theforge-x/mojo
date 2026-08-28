import { eventBus } from '@mojo/shared/events';
import { describe, expect, it } from 'vitest';
import type { TutorPerformanceRepository } from '../domain/tutor-performance.ports';
import type { TutorPerformance } from '../domain/tutor-performance.types';
import { makeRecomputeLevel } from './recompute-level.use-case';

function fakePerformances(initial: TutorPerformance | null = null) {
  let store = initial;
  const repo: TutorPerformanceRepository = {
    findByTutorId: async (tutorId) => (store && store.tutorId === tutorId ? store : null),
    save: async (perf) => {
      store = perf;
    },
  };
  return { repo, get: () => store };
}

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

describe('recomputeLevel', () => {
  it('promotes and publishes TutorLevelChanged when the level changes', async () => {
    const { repo, get } = fakePerformances();
    let captured: unknown = null;
    const unsubscribe = eventBus.subscribe('TutorLevelChanged', (e) => {
      captured = e;
    });
    try {
      const recompute = makeRecomputeLevel({ performances: repo });
      await recompute(
        perf({ cumulativeHoursTaught: 60, averageRating: 4.6 }),
        '2026-09-01T10:00:00.000Z',
      );
      expect(get()?.level).toBe('established');
      expect(captured).toMatchObject({
        name: 'TutorLevelChanged',
        payload: { tutorId: 't_1', fromLevel: 'entry', toLevel: 'established' },
      });
    } finally {
      unsubscribe();
    }
  });

  it('does not write or publish when the level is unchanged', async () => {
    const { repo, get } = fakePerformances(
      perf({ level: 'established', cumulativeHoursTaught: 60, averageRating: 4.6 }),
    );
    let published = false;
    const unsubscribe = eventBus.subscribe('TutorLevelChanged', () => {
      published = true;
    });
    try {
      await makeRecomputeLevel({ performances: repo })(
        perf({ level: 'established', cumulativeHoursTaught: 90, averageRating: 4.6 }),
        '2026-09-01T10:00:00.000Z',
      );
      expect(published).toBe(false);
      expect(get()?.level).toBe('established');
    } finally {
      unsubscribe();
    }
  });
});
