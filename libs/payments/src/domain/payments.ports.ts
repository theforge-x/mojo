import type { Money } from '@mojo/shared/domain';
import type { PayoutRequest, Wallet, WalletTransaction } from './wallet.types';

export interface WalletRepository {
  getWallet(tutorId: string): Promise<Wallet>;
  credit(tutorId: string, amount: Money, relatedSessionId: string | null): Promise<WalletTransaction>;
  savePayoutRequest(request: PayoutRequest): Promise<void>;
}

export interface PayoutRail {
  send(tutorId: string, amount: Money): Promise<{ externalRef: string }>;
}
