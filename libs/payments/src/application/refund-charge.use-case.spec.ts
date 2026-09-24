import { describe, expect, it } from 'vitest';
import type { ChargeRefund, StudentCharge } from '../domain/charge.types';
import type { ChargeRepository } from '../domain/payments.ports';
import {
  ChargeNotFoundError,
  ChargeNotRefundableError,
  makeRefundCharge,
  OverRefundError,
} from './refund-charge.use-case';

function fakeCharges(
  charge: StudentCharge,
  refunds: ChargeRefund[] = [],
): ChargeRepository & {
  savedRefunds: ChargeRefund[];
  savedCharges: StudentCharge[];
} {
  const savedRefunds: ChargeRefund[] = [];
  const savedCharges: StudentCharge[] = [];
  return {
    savedRefunds,
    savedCharges,
    save: async (c) => {
      savedCharges.push(c);
    },
    findById: async (id) => (charge.id === id ? charge : null),
    findBySession: async () => null,
    findByReference: async () => null,
    listByStudent: async () => [charge],
    saveRefund: async (r) => {
      savedRefunds.push(r);
    },
    listRefundsByStudent: async () => [...refunds, ...savedRefunds],
  };
}

const CHARGE: StudentCharge = {
  id: 'ch_1',
  studentId: 'st_1',
  tutorId: 't_1',
  sessionId: 's_1',
  segments: 4,
  perSegmentMinor: 400_000,
  standardTotalMinor: 1_600_000,
  trialDiscountMinor: 0,
  totalMinor: 1_600_000,
  currency: 'NGN',
  isTrial: false,
  level: 'entry',
  isCustomRate: false,
  paymentMethodId: 'pm_1',
  status: 'captured',
  providerReference: 'mojo_ch_1',
  createdAt: '2026-09-15T00:00:00.000Z',
};

describe('refundCharge', () => {
  it('refunds the full remaining balance by default', async () => {
    const charges = fakeCharges(CHARGE);
    const refundCharge = makeRefundCharge({ charges });

    const { refund, charge } = await refundCharge({
      chargeId: 'ch_1',
      studentId: 'st_1',
      reason: 'cancelled',
      nowIso: '2026-09-15T01:00:00.000Z',
    });

    expect(refund.amountMinor).toBe(1_600_000);
    expect(refund.reason).toBe('cancelled');
    expect(charge.status).toBe('refunded');
  });

  it('supports partial refunds and tracks the remainder', async () => {
    const charges = fakeCharges(CHARGE);
    const refundCharge = makeRefundCharge({ charges });

    const first = await refundCharge({
      chargeId: 'ch_1',
      studentId: 'st_1',
      amountMinor: 600_000,
      reason: 'goodwill',
      nowIso: '2026-09-15T01:00:00.000Z',
    });
    expect(first.charge.status).toBe('partially_refunded');

    await expect(
      refundCharge({
        chargeId: 'ch_1',
        studentId: 'st_1',
        amountMinor: 1_000_001,
        reason: 'goodwill',
        nowIso: '2026-09-15T02:00:00.000Z',
      }),
    ).rejects.toThrow(OverRefundError);
  });

  it('refuses strangers and double refunds', async () => {
    const charges = fakeCharges(CHARGE);
    const refundCharge = makeRefundCharge({ charges });

    await expect(
      refundCharge({
        chargeId: 'ch_1',
        studentId: 'st_other',
        reason: 'cancelled',
        nowIso: '2026-09-15T01:00:00.000Z',
      }),
    ).rejects.toThrow(ChargeNotFoundError);

    const refunded: StudentCharge = { ...CHARGE, status: 'refunded' };
    const refundedCharges = fakeCharges(refunded);
    const refundRefunded = makeRefundCharge({ charges: refundedCharges });
    await expect(
      refundRefunded({
        chargeId: 'ch_1',
        studentId: 'st_1',
        reason: 'cancelled',
        nowIso: '2026-09-15T01:00:00.000Z',
      }),
    ).rejects.toThrow(ChargeNotRefundableError);
  });

  it('refuses to refund pending or failed charges — no money moved', async () => {
    const pendingCharges = fakeCharges({ ...CHARGE, status: 'pending' });
    await expect(
      makeRefundCharge({ charges: pendingCharges })({
        chargeId: 'ch_1',
        studentId: 'st_1',
        reason: 'cancelled',
        nowIso: '2026-09-15T01:00:00.000Z',
      }),
    ).rejects.toThrow(ChargeNotRefundableError);
  });
});
