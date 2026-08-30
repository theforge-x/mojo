import type { Money } from '@mojo/shared/domain';
import { eventBus } from '@mojo/shared/events';
import type { PayoutRail, WalletRepository } from '../domain/payments.ports';

export interface ReleasePayoutInput {
  tutorId: string;
  amount: Money;
  nowIso: string;
}

export class InsufficientBalanceError extends Error {
  constructor() {
    super('Wallet balance is lower than the requested payout amount.');
  }
}

export function makeReleasePayout(deps: { wallets: WalletRepository; rail: PayoutRail }) {
  return async function releasePayout(input: ReleasePayoutInput): Promise<void> {
    const wallet = await deps.wallets.getWallet(input.tutorId);
    if (wallet.balance.amountMinor < input.amount.amountMinor) {
      throw new InsufficientBalanceError();
    }

    await eventBus.publish({
      name: 'PayoutRequested',
      occurredAt: input.nowIso,
      payload: { tutorId: input.tutorId, amount: input.amount },
    });

    const { externalRef } = await deps.rail.send(input.tutorId, input.amount);

    await eventBus.publish({
      name: 'PayoutCompleted',
      occurredAt: input.nowIso,
      payload: { tutorId: input.tutorId, amount: input.amount, rail: externalRef },
    });
  };
}
