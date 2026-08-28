import type { LessonSubscription } from './billing.types';

export interface SubscriptionRepository {
  findById(id: string): Promise<LessonSubscription | null>;
  findByStudent(studentId: string): Promise<LessonSubscription[]>;
  save(subscription: LessonSubscription): Promise<void>;
}
