import type { TutorLevel } from '@mojo/shared/domain';
import { describe, expect, it } from 'vitest';
import type { StudentCharge } from '../domain/charge.types';
import type {
  ChargeRateReader,
  ChargeRepository,
  StudentPaymentMethodRepository,
} from '../domain/payments.ports';
import {
  DuplicateChargeError,
  makeChargeStudent,
  NoPaymentMethodError,
  TrialAlreadyUsedError,
} from './charge-student.use-case';

const DEFAULTS: Record<TutorLevel, number> = {
  entry: 400_000,
  established: 600_000,
  expert: 800_000,
};

function fakeRates(level: TutorLevel = 'entry', custom: number | null = null): ChargeRateReader {
  return {
    getLevel: async () => level,
    hasMojoPlus: async () => custom !== null,
    getCustomRateMinor: async () => custom,
  };
}

function fakeMethods(withDefault: boolean): StudentPaymentMethodRepository {
  const method = {
    id: 'pm_1',
    studentId: 'st_1',
    rail: 'paystack' as const,
    last4: '0000',
    isDefault: true,
  };
  return {
    findByStudent: async () => (withDefault ? [method] : []),
    findDefault: async () => (withDefault ? method : null),
    save: async () => {},
  };
}

function fakeCharges(existing: StudentCharge[] = []): ChargeRepository & {
  saved: StudentCharge[];
} {
  const saved: StudentCharge[] = [];
  return {
    saved,
    save: async (charge) => {
      saved.push(charge);
    },
    findById: async (id) => saved.find((c) => c.id === id) ?? null,
    findBySession: async (sessionId) =>
      [...existing, ...saved].find((c) => c.sessionId === sessionId) ?? null,
    listByStudent: async () => [...existing, ...saved],
    saveRefund: async () => {},
    listRefundsByStudent: async () => [],
  };
}

const BASE = {
  studentId: 'st_1',
  tutorId: 't_1',
  sessionId: 's_1',
  startIso: '2026-09-20T10:00:00.000Z',
  endIso: '2026-09-20T11:00:00.000Z',
  isTrial: false,
  nowIso: '2026-09-15T00:00:00.000Z',
};

describe('chargeStudent', () => {
  it('charges segments × rate against the default method', async () => {
    const charges = fakeCharges();
    const chargeStudent = makeChargeStudent({
      charges,
      methods: fakeMethods(true),
      rates: fakeRates(),
      defaults: DEFAULTS,
    });

    const charge = await chargeStudent(BASE);

    // 60 minutes = 4 segments × ₦4,000 entry rate.
    expect(charge.segments).toBe(4);
    expect(charge.totalMinor).toBe(1_600_000);
    expect(charge.trialDiscountMinor).toBe(0);
    expect(charge.status).toBe('captured');
    expect(charge.paymentMethodId).toBe('pm_1');
    expect(charges.saved).toHaveLength(1);
  });

  it('applies the trial price and records the discount', async () => {
    const charges = fakeCharges();
    const chargeStudent = makeChargeStudent({
      charges,
      methods: fakeMethods(true),
      rates: fakeRates(),
      defaults: DEFAULTS,
    });

    const charge = await chargeStudent({ ...BASE, isTrial: true });

    expect(charge.totalMinor).toBe(800_000);
    expect(charge.trialDiscountMinor).toBe(800_000);
    expect(charge.isTrial).toBe(true);
  });

  it('refuses without a payment method on file', async () => {
    const charges = fakeCharges();
    const chargeStudent = makeChargeStudent({
      charges,
      methods: fakeMethods(false),
      rates: fakeRates(),
      defaults: DEFAULTS,
    });

    await expect(chargeStudent(BASE)).rejects.toThrow(NoPaymentMethodError);
    expect(charges.saved).toHaveLength(0);
  });

  it('refuses a second charge for the same session', async () => {
    const charges = fakeCharges();
    const chargeStudent = makeChargeStudent({
      charges,
      methods: fakeMethods(true),
      rates: fakeRates(),
      defaults: DEFAULTS,
    });

    await chargeStudent(BASE);
    await expect(chargeStudent(BASE)).rejects.toThrow(DuplicateChargeError);
  });

  it('honours the trial price once per tutor', async () => {
    const charges = fakeCharges();
    const chargeStudent = makeChargeStudent({
      charges,
      methods: fakeMethods(true),
      rates: fakeRates(),
      defaults: DEFAULTS,
    });

    await chargeStudent({ ...BASE, isTrial: true });
    await expect(chargeStudent({ ...BASE, sessionId: 's_2', isTrial: true })).rejects.toThrow(
      TrialAlreadyUsedError,
    );
    // Full-price rebooking with the same tutor is still fine.
    await chargeStudent({ ...BASE, sessionId: 's_2', isTrial: false });
  });
});
