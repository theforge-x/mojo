import { describe, expect, it } from 'vitest';
import { eventBus } from '@mojo/shared/events';
import type { DisputeRepository } from '../domain/trust-safety.ports';
import type { Dispute } from '../domain/trust-safety.types';
import { makeFileDispute } from './file-dispute.use-case';

function fakeDisputes(initial: Dispute | null = null) {
  let store = initial;
  const repo: DisputeRepository = {
    findById: async (id) => (store && store.id === id ? store : null),
    findBySession: async (sessionId) => (store && store.sessionId === sessionId ? store : null),
    save: async (dispute) => {
      store = dispute;
    },
  };
  return { repo, get: () => store };
}

function sampleDispute(): Dispute {
  return {
    id: 'd_1',
    sessionId: 's_1',
    filedBy: 'st_1',
    reason: 'tutor did not show',
    status: 'open',
    filedAt: '2026-09-01T10:00:00.000Z',
    resolvedAt: null,
  };
}

describe('fileDispute', () => {
  it('saves the dispute and publishes DisputeFiled', async () => {
    const { repo, get } = fakeDisputes();
    let captured: unknown = null;
    const unsubscribe = eventBus.subscribe('DisputeFiled', (e) => {
      captured = e;
    });
    try {
      const dispute = sampleDispute();
      await makeFileDispute({ disputes: repo })(dispute);
      expect(get()?.id).toBe('d_1');
      expect(captured).toMatchObject({
        name: 'DisputeFiled',
        payload: { sessionId: 's_1', filedBy: 'st_1', reason: 'tutor did not show' },
      });
    } finally {
      unsubscribe();
    }
  });
});
