import type { AnalyticsRepository } from '../domain/analytics.ports';
import type { TutorLeaderboardEntry } from '../domain/analytics.types';

/**
 * Ranks tutors by responsiveness (lower average response time ranks higher),
 * then by lower cancellation rate as a tiebreaker.
 */
export function makeBuildLeaderboard(deps: { analytics: AnalyticsRepository }) {
  return async function buildLeaderboard(limit: number): Promise<TutorLeaderboardEntry[]> {
    const candidates = await deps.analytics.listLeaderboardCandidates();
    const sorted = [...candidates]
      .sort((a, b) => {
        if (a.responseTimeMinutesAvg !== b.responseTimeMinutesAvg) {
          return a.responseTimeMinutesAvg - b.responseTimeMinutesAvg;
        }
        return a.cancellationRate - b.cancellationRate;
      })
      .slice(0, limit);

    return sorted.map((c, index) => ({
      tutorId: c.tutorId,
      displayName: c.displayName,
      responseTimeMinutesAvg: c.responseTimeMinutesAvg,
      cancellationRate: c.cancellationRate,
      rank: index + 1,
    }));
  };
}
