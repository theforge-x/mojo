import type { TutorSearchFilters, TutorSearchResult } from './discovery.types';

export interface TutorSearchIndex {
  search(filters: TutorSearchFilters): Promise<TutorSearchResult[]>;
}
