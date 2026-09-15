import type { Money } from '@mojo/shared/domain';
import { eventBus } from '@mojo/shared/events';
import type { PayoutRail, WalletRepository } from '../domain/payments.ports';

export interface ReleasePayoutInput {
  tutorId: string;
  amount: Money;
  nowIso: string;
  rail?: 'paystack' | 'flutterwave' | 'payoneer' | 'wise';
}

export class InsufficientBalanceError extends Error {
  constructor() {
    super('Wallet balance is lower than the requested payout amount.');
  }
}

/**
 * Records the payout request, sends it through the rail, then debits the
 * wallet — previously the request was never persisted and the balance never
 * moved, so a tutor could withdraw the same funds repeatedly.
 */
export function makeReleasePayout(deps: { wallets: WalletRepository; rail: PayoutRail }) {
  return async function releasePayout(input: ReleasePayoutInput): Promise<void> {
    const wallet = await deps.wallets.getWallet(input.tutorId);
    if (wallet.balance.amountMinor < input.amount.amountMinor) {
      throw new InsufficientBalanceError();
    }

    const request = {
      id: crypto.randomUUID(),
      tutorId: input.tutorId,
      amount: input.amount,
      rail: input.rail ?? 'paystack',
      status: 'pending' as const,
    };
    await deps.wallets.savePayoutRequest(request);

    await eventBus.publish({
      name: 'PayoutRequested',
      occurredAt: input.nowIso,
      payload: { tutorId: input.tutorId, amount: input.amount },
    });

    const { externalRef } = await deps.rail.send(input.tutorId, input.amount);

    await deps.wallets.savePayoutRequest({ ...request, status: 'completed' });
    await deps.wallets.debit(input.tutorId, input.amount, null);

    await eventBus.publish({
      name: 'PayoutCompleted',
      occurredAt: input.nowIso,
      payload: { tutorId: input.tutorId, amount: input.amount, rail: externalRef },
    });
  };
}
