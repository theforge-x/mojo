import { DEFAULT_SEGMENT_RATE_NGN } from '@mojo/pricing/domain';
import type { PrismaClient } from '@prisma/client';
import {
  type AvailabilityExceptionView,
  type AvailabilityView,
  type AvailabilityWindowView,
  hasAvailabilityWithin,
} from '../domain/available-within-hours';
import type { TutorSearchIndex } from '../domain/discovery.ports';
import type { TutorSearchFilters, TutorSearchResult } from '../domain/discovery.types';
import { tutorMatchesFilters } from '../domain/match-filters';

/**
 * In-process search over the consolidated schema. All five domain filters —
 * subject, level, language, minRating and availableWithinHours — are applied
 * here; availability is resolved from the scheduling tables rather than a
 * persisted column, so the `availableWithinHours` query is only issued when
 * the caller asks for it.
 */
export class PrismaTutorSearchIndex implements TutorSearchIndex {
  constructor(private readonly prisma: PrismaClient) {}

  async search(filters: TutorSearchFilters): Promise<TutorSearchResult[]> {
    const profiles = await this.prisma.tutorProfile.findMany();
    if (profiles.length === 0) return [];

    const tutorIds = profiles.map((p) => p.tutorId);
    const performances = await this.prisma.tutorPerformance.findMany({
      where: { tutorId: { in: tutorIds } },
    });
    const performanceByTutorId = new Map(performances.map((p) => [p.tutorId, p]));

    const availabilityByTutorId = new Map<string, AvailabilityView>();
    if (filters.availableWithinHours !== undefined) {
      const [rules, exceptions, settings] = await Promise.all([
        this.prisma.availabilityRule.findMany({ where: { tutorId: { in: tutorIds } } }),
        this.prisma.availabilityException.findMany({ where: { tutorId: { in: tutorIds } } }),
        this.prisma.schedulingSettings.findMany({ where: { tutorId: { in: tutorIds } } }),
      ]);
      const rulesByTutorId = groupBy(rules, (rule) => rule.tutorId);
      const exceptionsByTutorId = groupBy(exceptions, (exception) => exception.tutorId);
      const settingsByTutorId = new Map(settings.map((s) => [s.tutorId, s]));

      for (const profile of profiles) {
        const rawSettings = settingsByTutorId.get(profile.tutorId);
        availabilityByTutorId.set(profile.tutorId, {
          timezone: profile.timezone,
          rules: (rulesByTutorId.get(profile.tutorId) ?? []).map(
            (rule): AvailabilityWindowView => ({
              weekday: rule.weekday,
              startMinute: rule.startMinute,
              endMinute: rule.endMinute,
            }),
          ),
          exceptions: (exceptionsByTutorId.get(profile.tutorId) ?? []).map(
            (exception): AvailabilityExceptionView => ({
              dateKey: exception.date,
              kind: exception.kind,
              startMinute: exception.startMinute,
              endMinute: exception.endMinute,
            }),
          ),
          settings: rawSettings
            ? {
                bufferMinutes: rawSettings.bufferMinutes,
                minimumNoticeMinutes: rawSettings.minimumNoticeMinutes,
                pausedForNewBookings: rawSettings.pausedForNewBookings,
              }
            : null,
        });
      }
    }

    return profiles
      .filter((profile) => {
        const perf = performanceByTutorId.get(profile.tutorId);
        const level = perf?.level ?? 'entry';
        const rating = perf?.averageRating ?? 0;
        if (
          !tutorMatchesFilters(
            { subjects: profile.subjects, languages: profile.languages, level, rating },
            filters,
          )
        ) {
          return false;
        }
        if (filters.availableWithinHours !== undefined) {
          const availability = availabilityByTutorId.get(profile.tutorId);
          if (!availability) return false;
          return hasAvailabilityWithin(availability, filters.availableWithinHours);
        }
        return true;
      })
      .map((profile) => {
        const perf = performanceByTutorId.get(profile.tutorId);
        const level = perf?.level ?? 'entry';
        return {
          tutorId: profile.tutorId,
          displayName: profile.displayName,
          photoUrl: profile.photoUrl ?? '',
          education: profile.education,
          timezone: profile.timezone,
          level,
          perSegmentMinor: DEFAULT_SEGMENT_RATE_NGN[level],
          rating: perf?.averageRating ?? 0,
          responseTimeMinutesAvg: perf?.responseTimeMinutesAvg ?? 0,
        };
      });
  }
}

function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const grouped = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = grouped.get(k);
    if (bucket) bucket.push(item);
    else grouped.set(k, [item]);
  }
  return grouped;
}
