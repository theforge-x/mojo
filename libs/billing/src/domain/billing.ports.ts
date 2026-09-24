import type { LessonSubscription, PaymentMethod } from './billing.types';

export interface SubscriptionRepository {
  findById(id: string): Promise<LessonSubscription | null>;
  findByStudent(studentId: string): Promise<LessonSubscription[]>;
  save(subscription: LessonSubscription): Promise<void>;
}

export interface PaymentMethodRepository {
  findByStudent(studentId: string): Promise<PaymentMethod[]>;
  findDefault(studentId: string): Promise<PaymentMethod | null>;
  save(method: PaymentMethod): Promise<void>;
}
