import { describe, expect, it } from 'vitest';
import type { SubscriptionRepository } from '../domain/billing.ports';
import type { LessonSubscription } from '../domain/billing.types';
import { makePauseSubscription } from './manage-subscription.use-case';

function fakeSubscriptions(initial: LessonSubscription | null = null) {
  let store = initial;
  const repo: SubscriptionRepository = {
    findById: async (id) => (store && store.id === id ? store : null),
    findByStudent: async () => (store ? [store] : []),
    save: async (sub) => {
      store = sub;
    },
  };
  return { repo, get: () => store };
}

function activeSub(): LessonSubscription {
  return {
    id: 'sub_1',
    studentId: 'st_1',
    tutorId: 't_1',
    lessonsPerCycle: 4,
    cycleLengthDays: 28,
    autoRenew: true,
    status: 'active',
  };
}

describe('pauseSubscription', () => {
  it('flips an active subscription to paused and persists it', async () => {
    const { repo, get } = fakeSubscriptions(activeSub());
    await makePauseSubscription({ subscriptions: repo })(activeSub());
    expect(get()?.status).toBe('paused');
  });
});
