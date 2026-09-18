import type { Money, TutorLevel } from '@mojo/shared/domain';
import type { ChargeRefund, StudentCharge } from './charge.types';
import type { ReplacementGrant } from './replacement.types';
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
  /** Paystack reusable authorization code — present after one successful card payment. */
  readonly authorizationCode: string | null;
  readonly isDefault: boolean;
}

export interface ChargeAuthorization {
  readonly authorizationCode: string;
  readonly last4: string | null;
  readonly cardType: string | null;
}

export interface VerifiedTransaction {
  readonly reference: string;
  readonly status: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly paidAt: string | null;
  readonly authorization: ChargeAuthorization | null;
  readonly customerEmail: string | null;
}

/**
 * Collect side of a payment rail (Paystack). Kept next to the payout rail
 * so one adapter file owns each direction's wire shape.
 */
export interface PaymentCollector {
  initialize(input: {
    email: string;
    amountMinor: number;
    currency: string;
    reference: string;
    callbackUrl: string;
  }): Promise<{ authorizationUrl: string; accessCode: string; reference: string }>;
  verify(reference: string): Promise<VerifiedTransaction>;
  chargeAuthorization(input: {
    authorizationCode: string;
    email: string;
    amountMinor: number;
    currency: string;
    reference: string;
  }): Promise<{ reference: string; status: string }>;
  verifyWebhookSignature(payload: string, signature: string | null): boolean;
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
  findByReference(reference: string): Promise<StudentCharge | null>;
  listByStudent(studentId: string): Promise<StudentCharge[]>;
  saveRefund(refund: ChargeRefund): Promise<void>;
  listRefundsByStudent(studentId: string): Promise<ChargeRefund[]>;
}

export interface ReplacementGrantRepository {
  findById(id: string): Promise<ReplacementGrant | null>;
  findBySourceSession(sourceSessionId: string): Promise<ReplacementGrant | null>;
  findRedeemedSession(sessionId: string): Promise<ReplacementGrant | null>;
  listByStudent(studentId: string): Promise<ReplacementGrant[]>;
  save(grant: ReplacementGrant): Promise<void>;
}
