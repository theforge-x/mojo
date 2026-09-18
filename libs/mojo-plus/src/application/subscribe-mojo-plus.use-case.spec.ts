import { describe, expect, it } from 'vitest';
import type { MojoPlusRepository, MojoPlusSubscription } from '../domain/mojo-plus.types';
import {
  InvalidCustomRateError,
  MojoPlusRequiredError,
  makeCancelMojoPlus,
  makeSetCustomRate,
  makeSubscribeMojoPlus,
} from './subscribe-mojo-plus.use-case';

function fakeRepo(initial: MojoPlusSubscription | null = null) {
  let store = initial;
  const repo: MojoPlusRepository = {
    find: async (tutorId) => (store && store.tutorId === tutorId ? store : null),
    save: async (sub) => {
      store = sub;
    },
  };
  return { repo, get: () => store };
}

describe('subscribeMojoPlus / cancelMojoPlus', () => {
  it('activates a subscription', async () => {
    const { repo, get } = fakeRepo();
    await makeSubscribeMojoPlus({ subscriptions: repo })('t_1', '2026-09-01T00:00:00.000Z');
    expect(get()?.status).toBe('active');
  });

  it('cancelling clears status but keeps the record', async () => {
    const { repo, get } = fakeRepo({
      tutorId: 't_1',
      status: 'active',
      customSegmentRateMinor: null,
      subscribedAt: '2026-08-01T00:00:00.000Z',
      cancelledAt: null,
    });
    await makeCancelMojoPlus({ subscriptions: repo })('t_1', '2026-09-01T00:00:00.000Z');
    expect(get()?.status).toBe('cancelled');
  });
});

describe('setCustomRate', () => {
  it('rejects setting a custom rate without an active subscription', async () => {
    const { repo } = fakeRepo();
    await expect(makeSetCustomRate({ subscriptions: repo })('t_1', 900_000)).rejects.toThrow(
      MojoPlusRequiredError,
    );
  });

  it('allows setting a custom rate for an active subscriber', async () => {
    const { repo, get } = fakeRepo({
      tutorId: 't_1',
      status: 'active',
      customSegmentRateMinor: null,
      subscribedAt: '2026-08-01T00:00:00.000Z',
      cancelledAt: null,
    });
    await makeSetCustomRate({ subscriptions: repo })('t_1', 900_000);
    expect(get()?.customSegmentRateMinor).toBe(900_000);
  });

  it('rejects absurd custom rates', async () => {
    const { repo, get } = fakeRepo({
      tutorId: 't_1',
      status: 'active',
      customSegmentRateMinor: null,
      subscribedAt: '2026-08-01T00:00:00.000Z',
      cancelledAt: null,
    });
    const setCustomRate = makeSetCustomRate({ subscriptions: repo });
    await expect(setCustomRate('t_1', 0)).rejects.toThrow(InvalidCustomRateError);
    await expect(setCustomRate('t_1', 99_999_999)).rejects.toThrow(InvalidCustomRateError);
    expect(get()?.customSegmentRateMinor).toBeNull();
  });
});
