import { describe, expect, it } from 'vitest';
import type { DisputeRepository } from '../domain/trust-safety.ports';
import type { Dispute } from '../domain/trust-safety.types';
import {
  DisputeAlreadyResolvedError,
  DisputeNotFoundError,
  makeResolveDispute,
} from './resolve-dispute.use-case';

function openDispute(): Dispute {
  return {
    id: 'd_1',
    sessionId: 's_1',
    filedBy: 'student',
    reason: 'Late join.',
    status: 'open',
    filedAt: '2026-09-01T10:00:00.000Z',
    resolvedAt: null,
  };
}

function fakeRepo(dispute: Dispute | null): DisputeRepository & { saved: Dispute[] } {
  const saved: Dispute[] = [];
  return {
    saved,
    findById: async () => dispute,
    findBySession: async () => dispute,
    save: async (d) => {
      saved.push(d);
    },
  };
}

describe('resolveDispute', () => {
  it('upholds an open dispute with a resolution timestamp', async () => {
    const disputes = fakeRepo(openDispute());
    await makeResolveDispute({ disputes })({
      disputeId: 'd_1',
      outcome: 'upheld',
      nowIso: '2026-09-02T10:00:00.000Z',
    });
    expect(disputes.saved).toHaveLength(1);
    expect(disputes.saved[0]).toMatchObject({
      status: 'upheld',
      resolvedAt: '2026-09-02T10:00:00.000Z',
    });
  });

  it('throws for missing or already-resolved disputes', async () => {
    await expect(
      makeResolveDispute({ disputes: fakeRepo(null) })({
        disputeId: 'missing',
        outcome: 'dismissed',
        nowIso: '2026-09-02T10:00:00.000Z',
      }),
    ).rejects.toThrow(DisputeNotFoundError);

    await expect(
      makeResolveDispute({ disputes: fakeRepo({ ...openDispute(), status: 'dismissed' }) })({
        disputeId: 'd_1',
        outcome: 'upheld',
        nowIso: '2026-09-02T10:00:00.000Z',
      }),
    ).rejects.toThrow(DisputeAlreadyResolvedError);
  });
});
