import type { PrismaClient } from '@prisma/client';
import { DEFAULT_SEGMENT_RATE_NGN } from '@mojo/pricing/domain';
import type { TutorSearchIndex } from '../domain/discovery.ports';
import type { TutorSearchFilters, TutorSearchResult } from '../domain/discovery.types';

/**
 * In-process search over the consolidated schema. `language` and
 * `availableWithinHours` are accepted by the domain filters but have no
 * persisted column to filter on today, so they are intentionally not applied
 * (see the data-model `[dark spots]` note).
 */
export class PrismaTutorSearchIndex implements TutorSearchIndex {
  constructor(private readonly prisma: PrismaClient) {}

  async search(filters: TutorSearchFilters): Promise<TutorSearchResult[]> {
    const profiles = await this.prisma.tutorProfile.findMany();
    if (profiles.length === 0) return [];

    const performances = await this.prisma.tutorPerformance.findMany({
      where: { tutorId: { in: profiles.map((p) => p.tutorId) } },
    });
    const performanceByTutorId = new Map(performances.map((p) => [p.tutorId, p]));

    const results: TutorSearchResult[] = profiles
      .map((profile) => {
        const perf = performanceByTutorId.get(profile.tutorId);
        const level = perf?.level ?? 'entry';
        return {
          tutorId: profile.tutorId,
          displayName: profile.displayName,
          level,
          perSegmentMinor: DEFAULT_SEGMENT_RATE_NGN[level],
          rating: perf?.averageRating ?? 0,
          responseTimeMinutesAvg: perf?.responseTimeMinutesAvg ?? 0,
        };
      })
      .filter((r) => {
        if (filters.subject && !profiles.find((p) => p.tutorId === r.tutorId)?.subjects.includes(filters.subject)) {
          return false;
        }
        if (filters.level && r.level !== filters.level) return false;
        if (filters.minRating !== undefined && r.rating < filters.minRating) return false;
        return true;
      });

    return results;
  }
}
