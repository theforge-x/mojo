import { describe, expect, it } from 'vitest';
import { eventBus } from '@mojo/shared/events';
import type { ReviewRepository } from '../domain/reviews.ports';
import type { Review } from '../domain/reviews.types';
import { makeSubmitReview } from './submit-review.use-case';

function fakeReviews(initial: Review | null = null) {
  let store = initial;
  const repo: ReviewRepository = {
    findById: async (id) => (store && store.id === id ? store : null),
    findBySession: async (sessionId) => (store && store.sessionId === sessionId ? store : null),
    save: async (review) => {
      store = review;
    },
  };
  return { repo, get: () => store };
}

function sampleReview(): Review {
  return {
    id: 'rev_1',
    sessionId: 's_1',
    tutorId: 't_1',
    studentId: 'st_1',
    rating: 5,
    body: 'Great lesson',
    flagged: false,
    createdAt: '2026-09-01T10:00:00.000Z',
  };
}

describe('submitReview', () => {
  it('saves the review and publishes ReviewSubmitted', async () => {
    const { repo, get } = fakeReviews();
    let captured: unknown = null;
    const unsubscribe = eventBus.subscribe('ReviewSubmitted', (e) => {
      captured = e;
    });
    try {
      const review = sampleReview();
      await makeSubmitReview({ reviews: repo })(review);
      expect(get()?.id).toBe('rev_1');
      expect(captured).toMatchObject({
        name: 'ReviewSubmitted',
        payload: { sessionId: 's_1', tutorId: 't_1', rating: 5 },
      });
    } finally {
      unsubscribe();
    }
  });
});
