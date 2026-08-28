import type { Money } from '@mojo/shared/domain';

export type TransactionKind = 'credit' | 'debit' | 'payout' | 'manual_adjustment';

export interface WalletTransaction {
  readonly id: string;
  readonly tutorId: string;
  readonly kind: TransactionKind;
  readonly amount: Money;
  readonly relatedSessionId: string | null;
  readonly createdAt: string;
}

export interface Wallet {
  readonly tutorId: string;
  readonly balance: Money;
}

export type PayoutRail = 'paystack' | 'flutterwave' | 'payoneer' | 'wise';

export interface PayoutRequest {
  readonly id: string;
  readonly tutorId: string;
  readonly amount: Money;
  readonly rail: PayoutRail;
  readonly status: 'pending' | 'approved' | 'completed' | 'rejected';
}
