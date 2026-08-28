import type { PrismaClient } from '@prisma/client';
import type { AnalyticsRepository, LeaderboardCandidate } from '../domain/analytics.ports';

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async countActiveTutors(): Promise<number> {
    return this.prisma.user.count({ where: { role: 'tutor' } });
  }

  async countActiveStudents(): Promise<number> {
    return this.prisma.user.count({ where: { role: 'student' } });
  }

  async sumWalletCreditsMinor(): Promise<number> {
    const result = await this.prisma.walletTransaction.aggregate({
      _sum: { amountMinor: true },
      where: { kind: 'credit' },
    });
    return result._sum.amountMinor ?? 0;
  }

  async listLeaderboardCandidates(): Promise<LeaderboardCandidate[]> {
    const profiles = await this.prisma.tutorProfile.findMany();
    if (profiles.length === 0) return [];

    const performances = await this.prisma.tutorPerformance.findMany({
      where: { tutorId: { in: profiles.map((p) => p.tutorId) } },
    });
    const performanceByTutorId = new Map(performances.map((p) => [p.tutorId, p]));

    return profiles.map((profile) => {
      const perf = performanceByTutorId.get(profile.tutorId);
      return {
        tutorId: profile.tutorId,
        displayName: profile.displayName,
        responseTimeMinutesAvg: perf?.responseTimeMinutesAvg ?? Number.POSITIVE_INFINITY,
        cancellationRate: perf?.cancellationRate ?? 1,
      };
    });
  }
}
