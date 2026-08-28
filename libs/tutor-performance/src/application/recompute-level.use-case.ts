import { eventBus } from '@mojo/shared/events';
import { LEVEL_THRESHOLDS, type TutorPerformance } from '../domain/tutor-performance.types';
import type { TutorPerformanceRepository } from '../domain/tutor-performance.ports';
import type { TutorLevel } from '@mojo/pricing/domain';

/**
 * This is the module the modular-monolith doc singles out: never written to
 * directly, only derived from SessionCompleted / SessionCancelled /
 * SessionNoShow / ReviewSubmitted events (wiring to those subscriptions
 * happens at the composition root, not shown here).
 */
export function computeLevel(perf: TutorPerformance): TutorLevel {
  if (perf.cumulativeHoursTaught >= LEVEL_THRESHOLDS.expert.hours && perf.averageRating >= LEVEL_THRESHOLDS.expert.minRating) {
    return 'expert';
  }
  if (
    perf.cumulativeHoursTaught >= LEVEL_THRESHOLDS.established.hours &&
    perf.averageRating >= LEVEL_THRESHOLDS.established.minRating
  ) {
    return 'established';
  }
  return 'entry';
}

export function makeRecomputeLevel(deps: { performances: TutorPerformanceRepository }) {
  return async function recomputeLevel(perf: TutorPerformance, nowIso: string): Promise<void> {
    const newLevel = computeLevel(perf);
    if (newLevel !== perf.level) {
      await deps.performances.save({ ...perf, level: newLevel });
      await eventBus.publish({
        name: 'TutorLevelChanged',
        occurredAt: nowIso,
        payload: { tutorId: perf.tutorId, fromLevel: perf.level, toLevel: newLevel },
      });
    }
  };
}
