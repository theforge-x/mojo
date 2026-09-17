import { describe, expect, it } from 'vitest';
import type { TutorSearchIndex } from '../domain/discovery.ports';
import type { TutorSearchResult } from '../domain/discovery.types';
import { makeSearchTutors } from './search-tutors.use-case';

function fakeIndex(results: TutorSearchResult[]): TutorSearchIndex {
  return { search: async () => results };
}

describe('searchTutors', () => {
  it('delegates to the index and returns its results', async () => {
    const results: TutorSearchResult[] = [
      {
        tutorId: 't_1',
        displayName: 'Ada',
        photoUrl: 'https://avatars.example/ada.jpg',
        education: 'B.Sc. Maths',
        timezone: 'Africa/Lagos',
        level: 'established',
        perSegmentMinor: 600_000,
        rating: 4.6,
        responseTimeMinutesAvg: 90,
        introVideoUrl: '',
      },
    ];
    const searchTutors = makeSearchTutors({ index: fakeIndex(results) });
    const out = await searchTutors({ subject: 'maths' });
    expect(out).toHaveLength(1);
    expect(out[0]?.tutorId).toBe('t_1');
  });

  it('forwards the filters unchanged', async () => {
    let seen: unknown;
    const index: TutorSearchIndex = {
      search: async (filters) => {
        seen = filters;
        return [];
      },
    };
    await makeSearchTutors({ index })({ level: 'expert', minRating: 4.7 });
    expect(seen).toEqual({ level: 'expert', minRating: 4.7 });
  });
});
