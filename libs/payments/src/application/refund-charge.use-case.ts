import type { ChargeRefund, RefundReason, StudentCharge } from '../domain/charge.types';
import type { ChargeRepository } from '../domain/payments.ports';

export interface RefundChargeInput {
  chargeId: string;
  studentId: string;
  /** Defaults to the full remaining balance when omitted. */
  amountMinor?: number;
  reason: RefundReason;
  nowIso: string;
}

export class ChargeNotFoundError extends Error {
  constructor() {
    super('Charge not found.');
  }
}

export class ChargeNotRefundableError extends Error {
  constructor() {
    super('Only captured charges with a remaining balance can be refunded.');
  }
}

export class OverRefundError extends Error {
  constructor() {
    super('Refund amount is more than the remaining charge balance.');
  }
}

/**
 * Credits the student back against a captured charge — the refund/credit
 * path the cancellation and dispute flows settle through. Ownership is
 * enforced here (a student can only refund their own charges); session-state
 * policy (e.g. only cancelled sessions) lives with the caller, which can
 * see the booking.
 */
export function makeRefundCharge(deps: { charges: ChargeRepository }) {
  return async function refundCharge(
    input: RefundChargeInput,
  ): Promise<{ refund: ChargeRefund; charge: StudentCharge }> {
    const charge = await deps.charges.findById(input.chargeId);
    if (!charge || charge.studentId !== input.studentId) throw new ChargeNotFoundError();
    if (charge.status === 'refunded') throw new ChargeNotRefundableError();

    const prior = await deps.charges.listRefundsByStudent(input.studentId);
    const refundedSoFar = prior
      .filter((r) => r.chargeId === charge.id)
      .reduce((sum, r) => sum + r.amountMinor, 0);
    const remaining = charge.totalMinor - refundedSoFar;
    const amount = input.amountMinor ?? remaining;
    if (!Number.isInteger(amount) || amount <= 0 || amount > remaining) throw new OverRefundError();

    const refund: ChargeRefund = {
      id: crypto.randomUUID(),
      chargeId: charge.id,
      studentId: input.studentId,
      amountMinor: amount,
      currency: charge.currency,
      reason: input.reason,
      createdAt: input.nowIso,
    };
    await deps.charges.saveRefund(refund);

    const updated: StudentCharge = {
      ...charge,
      status: amount === remaining ? 'refunded' : 'partially_refunded',
    };
    await deps.charges.save(updated);
    return { refund, charge: updated };
  };
}
