import type { TutorSearchIndex } from '../domain/discovery.ports';
import type { TutorSearchFilters, TutorSearchResult } from '../domain/discovery.types';

export function makeSearchTutors(deps: { index: TutorSearchIndex }) {
  return async function searchTutors(filters: TutorSearchFilters): Promise<TutorSearchResult[]> {
    return deps.index.search(filters);
  };
}
