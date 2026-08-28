import { describe, expect, it } from 'vitest';
import { money } from '@mojo/shared/domain';
import type { PayoutRail, WalletRepository } from '../domain/payments.ports';
import { InsufficientBalanceError, makeReleasePayout } from './release-payout.use-case';

describe('releasePayout', () => {
  it('sends the payout through the rail when balance covers it', async () => {
    const wallets: WalletRepository = {
      getWallet: async () => ({ tutorId: 't_1', balance: money(5_000_000, 'NGN') }),
      credit: async () => ({ id: 'tx_1', tutorId: 't_1', kind: 'payout', amount: money(0, 'NGN'), relatedSessionId: null, createdAt: '' }),
      savePayoutRequest: async () => {},
    };
    let sent = false;
    const rail: PayoutRail = {
      send: async () => {
        sent = true;
        return { externalRef: 'paystack_ref_1' };
      },
    };
    const releasePayout = makeReleasePayout({ wallets, rail });

    await releasePayout({ tutorId: 't_1', amount: money(4_200_000, 'NGN'), nowIso: '2026-09-01T00:00:00.000Z' });

    expect(sent).toBe(true);
  });

  it('refuses to pay out more than the wallet balance', async () => {
    const wallets: WalletRepository = {
      getWallet: async () => ({ tutorId: 't_1', balance: money(1_000_000, 'NGN') }),
      credit: async () => ({ id: 'tx_1', tutorId: 't_1', kind: 'payout', amount: money(0, 'NGN'), relatedSessionId: null, createdAt: '' }),
      savePayoutRequest: async () => {},
    };
    const rail: PayoutRail = { send: async () => ({ externalRef: 'unused' }) };
    const releasePayout = makeReleasePayout({ wallets, rail });

    await expect(
      releasePayout({ tutorId: 't_1', amount: money(4_200_000, 'NGN'), nowIso: '2026-09-01T00:00:00.000Z' }),
    ).rejects.toThrow(InsufficientBalanceError);
  });
});
