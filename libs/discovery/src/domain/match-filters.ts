import type { TutorLevel } from '@mojo/shared/domain';
import type { TutorSearchFilters } from './discovery.types';

export interface TutorFilterContext {
  readonly subjects: readonly string[];
  readonly languages: readonly string[];
  readonly level: TutorLevel;
  readonly rating: number;
}

export function tutorMatchesFilters(ctx: TutorFilterContext, filters: TutorSearchFilters): boolean {
  if (filters.subject && !ctx.subjects.includes(filters.subject)) return false;
  if (filters.level && ctx.level !== filters.level) return false;
  if (filters.language && !ctx.languages.includes(filters.language)) return false;
  if (filters.minRating !== undefined && ctx.rating < filters.minRating) return false;
  return true;
}
