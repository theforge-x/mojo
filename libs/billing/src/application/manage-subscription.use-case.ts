import type { SubscriptionRepository } from '../domain/billing.ports';
import type { LessonSubscription } from '../domain/billing.types';

export function makePauseSubscription(deps: { subscriptions: SubscriptionRepository }) {
  return async function pauseSubscription(sub: LessonSubscription): Promise<void> {
    await deps.subscriptions.save({ ...sub, status: 'paused' });
  };
}

export function makeResumeSubscription(deps: { subscriptions: SubscriptionRepository }) {
  return async function resumeSubscription(sub: LessonSubscription): Promise<void> {
    await deps.subscriptions.save({ ...sub, status: 'active' });
  };
}

export function makeCancelSubscription(deps: { subscriptions: SubscriptionRepository }) {
  return async function cancelSubscription(sub: LessonSubscription): Promise<void> {
    await deps.subscriptions.save({ ...sub, status: 'cancelled', autoRenew: false });
  };
}
