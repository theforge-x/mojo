import type { TutorLevel } from '@mojo/shared/domain';

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
  readonly photoUrl: string;
  readonly education: string;
  readonly timezone: string;
  readonly level: TutorLevel;
  readonly perSegmentMinor: number;
  readonly rating: number;
  readonly responseTimeMinutesAvg: number;
}
