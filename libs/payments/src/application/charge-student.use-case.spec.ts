import type { TutorLevel } from '@mojo/shared/domain';
import { describe, expect, it } from 'vitest';
import type { StudentCharge } from '../domain/charge.types';
import type {
  ChargeRateReader,
  ChargeRepository,
  ReplacementGrantRepository,
  StudentPaymentMethodRepository,
} from '../domain/payments.ports';
import type { ReplacementGrant } from '../domain/replacement.types';
import {
  DuplicateChargeError,
  InvalidReplacementGrantError,
  makeChargeStudent,
  NoPaymentMethodError,
  TrialAlreadyUsedError,
} from './charge-student.use-case';
import { makeGrantReplacement } from './grant-replacement.use-case';

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
    findByReference: async () => null,
    listByStudent: async () => [...existing, ...saved],
    saveRefund: async () => {},
    listRefundsByStudent: async () => [],
  };
}

function fakeGrants(existing: ReplacementGrant[] = []): ReplacementGrantRepository & {
  saved: ReplacementGrant[];
} {
  const saved: ReplacementGrant[] = [];
  const all = () => [...existing, ...saved];
  return {
    saved,
    findById: async (id) => all().find((g) => g.id === id) ?? null,
    findBySourceSession: async (sourceSessionId) =>
      all().find((g) => g.sourceSessionId === sourceSessionId) ?? null,
    findRedeemedSession: async (sessionId) =>
      all().find((g) => g.redeemedSessionId === sessionId) ?? null,
    listByStudent: async (studentId) => all().filter((g) => g.studentId === studentId),
    save: async (grant) => {
      const index = saved.findIndex((g) => g.id === grant.id);
      if (index >= 0) saved[index] = grant;
      else saved.push(grant);
    },
  };
}

const stubCollect = {
  initialize: async () => ({
    authorizationUrl: 'https://pay.test/x',
    accessCode: 'x',
    reference: 'x',
  }),
  verify: async () => ({
    reference: 'x',
    status: 'success',
    amountMinor: 0,
    currency: 'NGN',
    paidAt: null,
    authorization: null,
    customerEmail: null,
  }),
  chargeAuthorization: async () => ({ reference: 'x', status: 'success' }),
  verifyWebhookSignature: () => true,
};

function deps(
  charges: ChargeRepository & { saved: StudentCharge[] },
  withDefault = true,
): Parameters<typeof makeChargeStudent>[0] {
  return {
    charges,
    methods: fakeMethods(withDefault),
    rates: fakeRates(),
    defaults: DEFAULTS,
    grants: fakeGrants(),
    collect: stubCollect,
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
    const chargeStudent = makeChargeStudent(deps(charges));

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
    const chargeStudent = makeChargeStudent(deps(charges));

    const charge = await chargeStudent({ ...BASE, isTrial: true });

    expect(charge.totalMinor).toBe(800_000);
    expect(charge.trialDiscountMinor).toBe(800_000);
    expect(charge.isTrial).toBe(true);
  });

  it('refuses without a payment method on file', async () => {
    const charges = fakeCharges();
    const chargeStudent = makeChargeStudent(deps(charges, false));

    await expect(chargeStudent(BASE)).rejects.toThrow(NoPaymentMethodError);
    expect(charges.saved).toHaveLength(0);
  });

  it('refuses a second charge for the same session', async () => {
    const charges = fakeCharges();
    const chargeStudent = makeChargeStudent(deps(charges));

    await chargeStudent(BASE);
    await expect(chargeStudent(BASE)).rejects.toThrow(DuplicateChargeError);
  });

  it('honours the trial price once per tutor', async () => {
    const charges = fakeCharges();
    const chargeStudent = makeChargeStudent(deps(charges));

    await chargeStudent({ ...BASE, isTrial: true });
    await expect(chargeStudent({ ...BASE, sessionId: 's_2', isTrial: true })).rejects.toThrow(
      TrialAlreadyUsedError,
    );
    // Full-price rebooking with the same tutor is still fine.
    await chargeStudent({ ...BASE, sessionId: 's_2', isTrial: false });
  });

  it('settles a granted replacement at zero and redeems it exactly once', async () => {
    const grants = fakeGrants();
    const charges = fakeCharges();
    const chargeStudent = makeChargeStudent({
      charges,
      methods: fakeMethods(true),
      rates: fakeRates(),
      defaults: DEFAULTS,
      grants,
      collect: stubCollect,
    });
    const grant = await makeGrantReplacement({ grants })({
      studentId: 'st_1',
      tutorId: 't_1',
      sourceSessionId: 's_cancelled',
      nowIso: BASE.nowIso,
    });

    const charge = await chargeStudent({
      ...BASE,
      sessionId: 's_replacement',
      isTrial: true,
      replacementGrantId: grant?.id,
    });

    expect(charge.totalMinor).toBe(0);
    expect(charge.trialDiscountMinor).toBe(1_600_000);
    await expect(
      chargeStudent({
        ...BASE,
        sessionId: 's_another',
        isTrial: true,
        replacementGrantId: grant?.id,
      }),
    ).rejects.toThrow(InvalidReplacementGrantError);
  });

  it('never mints a follow-up grant from a redeemed session', async () => {
    const grants = fakeGrants();
    const grantReplacement = makeGrantReplacement({ grants });
    const first = await grantReplacement({
      studentId: 'st_1',
      tutorId: 't_1',
      sourceSessionId: 's_cancelled',
      nowIso: BASE.nowIso,
    });
    expect(first?.status).toBe('granted');
    await grants.save({
      ...(first as ReplacementGrant),
      status: 'redeemed',
      redeemedSessionId: 's_replacement',
      redeemedAt: BASE.nowIso,
    });
    const followUp = await grantReplacement({
      studentId: 'st_1',
      tutorId: 't_1',
      sourceSessionId: 's_replacement',
      nowIso: BASE.nowIso,
    });
    expect(followUp).toBeNull();
  });
});
