import { money } from '@mojo/shared/domain';
import { describe, expect, it } from 'vitest';
import type { PayoutRail, WalletRepository } from '../domain/payments.ports';
import { InsufficientBalanceError, makeReleasePayout } from './release-payout.use-case';

describe('releasePayout', () => {
  function fakeWallets(balanceMinor: number): WalletRepository & {
    saved: unknown[];
    debited: unknown[];
  } {
    const saved: unknown[] = [];
    const debited: unknown[] = [];
    return {
      saved,
      debited,
      getWallet: async () => ({ tutorId: 't_1', balance: money(balanceMinor, 'NGN') }),
      listTransactions: async () => [],
      credit: async () => ({
        id: 'tx_1',
        tutorId: 't_1',
        kind: 'payout',
        amount: money(0, 'NGN'),
        relatedSessionId: null,
        createdAt: '',
      }),
      debit: async (tutorId, amount, relatedSessionId) => {
        debited.push({ tutorId, amount, relatedSessionId });
        return {
          id: 'tx_2',
          tutorId,
          kind: 'payout',
          amount,
          relatedSessionId,
          createdAt: '',
        };
      },
      savePayoutRequest: async (request) => {
        saved.push(request);
      },
    };
  }

  it('sends the payout through the rail when balance covers it', async () => {
    const wallets = fakeWallets(5_000_000);
    let sent = false;
    const rail: PayoutRail = {
      send: async () => {
        sent = true;
        return { externalRef: 'paystack_ref_1' };
      },
    };
    const releasePayout = makeReleasePayout({ wallets, rail });

    await releasePayout({
      tutorId: 't_1',
      amount: money(4_200_000, 'NGN'),
      nowIso: '2026-09-01T00:00:00.000Z',
    });

    expect(sent).toBe(true);
    expect(wallets.saved).toHaveLength(2);
    expect(wallets.saved[1]).toMatchObject({ tutorId: 't_1', status: 'completed' });
    expect(wallets.debited).toHaveLength(1);
  });

  it('refuses to pay out more than the wallet balance', async () => {
    const wallets = fakeWallets(1_000_000);
    const rail: PayoutRail = { send: async () => ({ externalRef: 'unused' }) };
    const releasePayout = makeReleasePayout({ wallets, rail });

    await expect(
      releasePayout({
        tutorId: 't_1',
        amount: money(4_200_000, 'NGN'),
        nowIso: '2026-09-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(InsufficientBalanceError);
    expect(wallets.saved).toHaveLength(0);
    expect(wallets.debited).toHaveLength(0);
  });
});
