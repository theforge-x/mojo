import type { Money, TutorLevel } from '@mojo/shared/domain';
import type { ChargeRefund, StudentCharge } from './charge.types';
import type { PayoutRequest, Wallet, WalletTransaction } from './wallet.types';

export interface WalletRepository {
  getWallet(tutorId: string): Promise<Wallet>;
  credit(
    tutorId: string,
    amount: Money,
    relatedSessionId: string | null,
  ): Promise<WalletTransaction>;
  debit(
    tutorId: string,
    amount: Money,
    relatedSessionId: string | null,
  ): Promise<WalletTransaction>;
  savePayoutRequest(request: PayoutRequest): Promise<void>;
}

export interface PayoutRail {
  send(tutorId: string, amount: Money): Promise<{ externalRef: string }>;
}

/**
 * Reader over the tutor's current rate card. Declared here (rather than
 * importing `@mojo/pricing/domain`) because bounded modules may only depend
 * on shared libs — the composition root injects a structurally compatible
 * level reader. Same shape as pricing's `TutorLevelReader` on purpose.
 */
export interface ChargeRateReader {
  getLevel(tutorId: string): Promise<TutorLevel>;
  hasMojoPlus(tutorId: string): Promise<boolean>;
  getCustomRateMinor(tutorId: string): Promise<number | null>;
}

/**
 * The card (or rail reference) a student's charge settles against. Mirrors
 * billing's `PaymentMethod` shape on purpose — same structural contract, no
 * cross-module import.
 */
export interface StudentPaymentMethod {
  readonly id: string;
  readonly studentId: string;
  readonly rail: 'paystack' | 'flutterwave' | 'stripe';
  readonly last4: string | null;
  readonly isDefault: boolean;
}

export interface StudentPaymentMethodRepository {
  findByStudent(studentId: string): Promise<StudentPaymentMethod[]>;
  findDefault(studentId: string): Promise<StudentPaymentMethod | null>;
  save(method: StudentPaymentMethod): Promise<void>;
}

export interface ChargeRepository {
  save(charge: StudentCharge): Promise<void>;
  findById(chargeId: string): Promise<StudentCharge | null>;
  findBySession(sessionId: string): Promise<StudentCharge | null>;
  listByStudent(studentId: string): Promise<StudentCharge[]>;
  saveRefund(refund: ChargeRefund): Promise<void>;
  listRefundsByStudent(studentId: string): Promise<ChargeRefund[]>;
}
