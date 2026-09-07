import { describe, expect, it } from 'vitest';
import type { TutorSearchFilters } from './discovery.types';
import { tutorMatchesFilters } from './match-filters';

const ctx = {
  subjects: ['Spanish', 'Maths'],
  languages: ['English', 'French'],
  level: 'established' as const,
  rating: 4.5,
};

const noFilters: TutorSearchFilters = {};

describe('tutorMatchesFilters', () => {
  it('matches any tutor when no filters are applied', () => {
    expect(tutorMatchesFilters(ctx, noFilters)).toBe(true);
  });

  it('matches on subject', () => {
    expect(tutorMatchesFilters(ctx, { subject: 'Spanish' })).toBe(true);
    expect(tutorMatchesFilters(ctx, { subject: 'Guitar' })).toBe(false);
  });

  it('matches on level', () => {
    expect(tutorMatchesFilters(ctx, { level: 'established' })).toBe(true);
    expect(tutorMatchesFilters(ctx, { level: 'entry' })).toBe(false);
  });

  it('matches on language', () => {
    expect(tutorMatchesFilters(ctx, { language: 'French' })).toBe(true);
    expect(tutorMatchesFilters(ctx, { language: 'English' })).toBe(true);
    expect(tutorMatchesFilters(ctx, { language: 'Yoruba' })).toBe(false);
  });

  it('matches on minimum rating', () => {
    expect(tutorMatchesFilters(ctx, { minRating: 4.5 })).toBe(true);
    expect(tutorMatchesFilters(ctx, { minRating: 5 })).toBe(false);
  });

  it('combines filters with AND semantics', () => {
    expect(tutorMatchesFilters(ctx, { subject: 'Spanish', language: 'English' })).toBe(true);
    expect(tutorMatchesFilters(ctx, { subject: 'Spanish', language: 'Yoruba' })).toBe(false);
  });
});
