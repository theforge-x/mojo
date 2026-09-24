import type { AnalyticsRepository } from '../domain/analytics.ports';
import type { PlatformMetrics } from '../domain/analytics.types';

/**
 * Aggregates the platform-level numbers from the analytics repository,
 * including the trial→paid cohort rate computed from session history.
 */
export function makeComputePlatformMetrics(deps: { analytics: AnalyticsRepository }) {
  return async function computePlatformMetrics(nowIso: string): Promise<PlatformMetrics> {
    const [gmvMinor, activeTutors, activeStudents, trialToPaidConversionRate] = await Promise.all([
      deps.analytics.sumWalletCreditsMinor(),
      deps.analytics.countActiveTutors(),
      deps.analytics.countActiveStudents(),
      deps.analytics.trialToPaidConversionRate(),
    ]);
    return {
      gmvMinor,
      activeTutors,
      activeStudents,
      trialToPaidConversionRate,
      asOf: nowIso,
    };
  };
}
