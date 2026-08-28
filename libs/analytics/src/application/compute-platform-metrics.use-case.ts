import type { AnalyticsRepository } from '../domain/analytics.ports';
import type { PlatformMetrics } from '../domain/analytics.types';

/**
 * Aggregates the platform-level numbers from the analytics repository.
 *
 * `trialToPaidConversionRate` is reported as 0 for now: deriving a true
 * trial→paid cohort rate needs a follow-up query over first-purchase
 * sessions that this minimal surface does not yet compute (flagged honestly
 * rather than fabricated).
 */
export function makeComputePlatformMetrics(deps: { analytics: AnalyticsRepository }) {
  return async function computePlatformMetrics(nowIso: string): Promise<PlatformMetrics> {
    const [gmvMinor, activeTutors, activeStudents] = await Promise.all([
      deps.analytics.sumWalletCreditsMinor(),
      deps.analytics.countActiveTutors(),
      deps.analytics.countActiveStudents(),
    ]);
    return {
      gmvMinor,
      activeTutors,
      activeStudents,
      trialToPaidConversionRate: 0,
      asOf: nowIso,
    };
  };
}
