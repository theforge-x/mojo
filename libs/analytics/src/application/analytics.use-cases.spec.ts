import { describe, expect, it } from 'vitest';
import type { AnalyticsRepository, LeaderboardCandidate } from '../domain/analytics.ports';
import { makeComputePlatformMetrics } from './compute-platform-metrics.use-case';
import { makeBuildLeaderboard } from './build-leaderboard.use-case';

function fakeAnalytics(candidates: LeaderboardCandidate[] = []): AnalyticsRepository {
  return {
    countActiveTutors: async () => 12,
    countActiveStudents: async () => 30,
    sumWalletCreditsMinor: async () => 4_000_000,
    listLeaderboardCandidates: async () => candidates,
  };
}

describe('computePlatformMetrics', () => {
  it('aggregates gmv and active counts for the given timestamp', async () => {
    const compute = makeComputePlatformMetrics({ analytics: fakeAnalytics() });
    const metrics = await compute('2026-09-01T00:00:00.000Z');
    expect(metrics).toMatchObject({
      gmvMinor: 4_000_000,
      activeTutors: 12,
      activeStudents: 30,
      trialToPaidConversionRate: 0,
      asOf: '2026-09-01T00:00:00.000Z',
    });
  });
});

describe('buildLeaderboard', () => {
  const candidates: LeaderboardCandidate[] = [
    { tutorId: 't_1', displayName: 'Ada', responseTimeMinutesAvg: 120, cancellationRate: 0.05 },
    { tutorId: 't_2', displayName: 'Ben', responseTimeMinutesAvg: 45, cancellationRate: 0.1 },
    { tutorId: 't_3', displayName: 'Chi', responseTimeMinutesAvg: 45, cancellationRate: 0.02 },
  ];

  it('ranks by response time, then cancellation rate, and caps at the limit', async () => {
    const build = makeBuildLeaderboard({ analytics: fakeAnalytics(candidates) });
    const out = await build(2);
    expect(out.map((e) => e.tutorId)).toEqual(['t_3', 't_2']);
    expect(out[0]?.rank).toBe(1);
    expect(out[1]?.rank).toBe(2);
  });
});
