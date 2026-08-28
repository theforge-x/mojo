import { eventBus } from '@mojo/shared/events';
import type { ReviewRepository } from '../domain/reviews.ports';
import type { Review } from '../domain/reviews.types';

export function makeSubmitReview(deps: { reviews: ReviewRepository }) {
  return async function submitReview(review: Review): Promise<void> {
    await deps.reviews.save(review);
    await eventBus.publish({
      name: 'ReviewSubmitted',
      occurredAt: review.createdAt,
      payload: { sessionId: review.sessionId, tutorId: review.tutorId, rating: review.rating },
    });
  };
}
