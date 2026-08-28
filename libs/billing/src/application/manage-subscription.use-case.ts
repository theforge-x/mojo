import type { SubscriptionRepository } from '../domain/billing.ports';
import type { LessonSubscription } from '../domain/billing.types';

export function makePauseSubscription(deps: { subscriptions: SubscriptionRepository }) {
  return async function pauseSubscription(sub: LessonSubscription): Promise<void> {
    await deps.subscriptions.save({ ...sub, status: 'paused' });
  };
}
