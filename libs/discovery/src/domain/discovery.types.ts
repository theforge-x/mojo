import type { TutorLevel } from '@mojo/pricing/domain';

export interface TutorSearchFilters {
  readonly subject?: string;
  readonly level?: TutorLevel;
  readonly language?: string;
  readonly minRating?: number;
  readonly availableWithinHours?: number;
}

export interface TutorSearchResult {
  readonly tutorId: string;
  readonly displayName: string;
  readonly level: TutorLevel;
  readonly perSegmentMinor: number;
  readonly rating: number;
  readonly responseTimeMinutesAvg: number;
}
