import type { Review } from './reviews.types';

export interface ReviewRepository {
  findById(id: string): Promise<Review | null>;
  findBySession(sessionId: string): Promise<Review | null>;
  listByTutor(tutorId: string): Promise<Review[]>;
  save(review: Review): Promise<void>;
}
