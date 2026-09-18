import type { TutorLevel } from '@mojo/shared/domain';
import { describe, expect, it } from 'vitest';
import type { StudentCharge } from '../domain/charge.types';
import type { StudentPaymentMethodRepository } from '../domain/payments.ports';
import {
  ChargeNotCapturedError,
  makeCaptureCharge,
  makeInitializeCharge,
  PendingChargeExistsError,
  UnknownReferenceError,
} from './redirect-collect.use-case';

const DEFAULTS: Record<TutorLevel, number> = {
  entry: 400_000,
  established: 600_000,
  expert: 800_000,
};

const BASE = {
  studentId: 'st_1',
  tutorId: 't_1',
  sessionId: 's_1',
  startIso: '2026-09-20T10:00:00.000Z',
  endIso: '2026-09-20T11:00:00.000Z',
  isTrial: false,
  customerEmail: 'ada@example.com',
  callbackUrl: 'https://mojo.test/payments/verify',
  nowIso: '2026-09-15T00:00:00.000Z',
};

function fakeCharges(existing: StudentCharge[] = []) {
  const saved: StudentCharge[] = [...existing];
  return {
    saved,
    save: async (charge: StudentCharge) => {
      const index = saved.findIndex((c) => c.id === charge.id);
      if (index >= 0) saved[index] = charge;
      else saved.push(charge);
    },
    findById: async (id: string) => saved.find((c) => c.id === id) ?? null,
    findBySession: async (sessionId: string) =>
      saved.find((c) => c.sessionId === sessionId) ?? null,
    findByReference: async (reference: string) =>
      saved.find((c) => c.providerReference === reference) ?? null,
    listByStudent: async (studentId: string) => saved.filter((c) => c.studentId === studentId),
    saveRefund: async () => {},
    listRefundsByStudent: async () => [],
  };
}

function fakeMethods() {
  const saved: { id: string; authorizationCode: string | null; isDefault: boolean }[] = [];
  const methods: StudentPaymentMethodRepository = {
    findByStudent: async () =>
      saved.map((m) => ({ ...m, studentId: 'st_1', rail: 'paystack' as const, last4: '0000' })),
    findDefault: async () => null,
    save: async (method) => {
      saved.push({
        id: method.id,
        authorizationCode: method.authorizationCode,
        isDefault: method.isDefault,
      });
    },
  };
  return { methods, saved };
}

function pendingCharge(): StudentCharge {
  return {
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
    paymentMethodId: '',
    status: 'pending',
    providerReference: 'mojo_ch_1',
    createdAt: BASE.nowIso,
  };
}

describe('initializeCharge', () => {
  it('books a pending row and opens the rail transaction', async () => {
    const charges = fakeCharges();
    const initializeCharge = makeInitializeCharge({
      charges,
      rates: {
        getLevel: async () => 'entry' as const,
        hasMojoPlus: async () => false,
        getCustomRateMinor: async () => null,
        groupPerSegmentMinor: async () => DEFAULTS.entry,
      },
      defaults: DEFAULTS,
      collect: {
        initialize: async (input) => ({
          authorizationUrl: `https://pay.test/${input.reference}`,
          accessCode: 'access',
          reference: input.reference,
        }),
        verify: async () => {
          throw new Error('not called');
        },
        chargeAuthorization: async () => {
          throw new Error('not called');
        },
        verifyWebhookSignature: () => false,
      },
    });

    const { charge, authorizationUrl } = await initializeCharge(BASE);

    expect(charge.status).toBe('pending');
    expect(charge.providerReference).toBe(`mojo_${charge.id}`);
    expect(authorizationUrl).toContain(charge.providerReference ?? '');
    expect(charges.saved).toHaveLength(1);
  });

  it('resumes the pending row instead of double-booking', async () => {
    const charges = fakeCharges([pendingCharge()]);
    let initializes = 0;
    const initializeCharge = makeInitializeCharge({
      charges,
      rates: {
        getLevel: async () => 'entry' as const,
        hasMojoPlus: async () => false,
        getCustomRateMinor: async () => null,
        groupPerSegmentMinor: async () => DEFAULTS.entry,
      },
      defaults: DEFAULTS,
      collect: {
        initialize: async () => {
          initializes += 1;
          return {
            authorizationUrl: 'https://pay.test/mojo_ch_1',
            accessCode: 'a',
            reference: 'mojo_ch_1',
          };
        },
        verify: async () => {
          throw new Error('not called');
        },
        chargeAuthorization: async () => {
          throw new Error('not called');
        },
        verifyWebhookSignature: () => false,
      },
    });

    const { charge } = await initializeCharge(BASE);

    expect(charge.id).toBe('ch_1');
    expect(initializes).toBe(1);
    expect(charges.saved).toHaveLength(1);
  });

  it('refuses when a settled charge already exists', async () => {
    const charges = fakeCharges([{ ...pendingCharge(), status: 'captured' }]);
    const initializeCharge = makeInitializeCharge({
      charges,
      rates: {
        getLevel: async () => 'entry' as const,
        hasMojoPlus: async () => false,
        getCustomRateMinor: async () => null,
        groupPerSegmentMinor: async () => DEFAULTS.entry,
      },
      defaults: DEFAULTS,
      collect: {
        initialize: async () => ({ authorizationUrl: 'x', accessCode: 'x', reference: 'x' }),
        verify: async () => {
          throw new Error('not called');
        },
        chargeAuthorization: async () => {
          throw new Error('not called');
        },
        verifyWebhookSignature: () => false,
      },
    });

    await expect(initializeCharge(BASE)).rejects.toThrow(PendingChargeExistsError);
  });
});

describe('captureCharge', () => {
  it('captures on rail success and stores the card for rebook', async () => {
    const charges = fakeCharges([pendingCharge()]);
    const { methods, saved } = fakeMethods();
    const captureCharge = makeCaptureCharge({
      charges,
      methods,
      collect: {
        initialize: async () => {
          throw new Error('not called');
        },
        verify: async () => ({
          reference: 'mojo_ch_1',
          status: 'success',
          amountMinor: 1_600_000,
          currency: 'NGN',
          paidAt: '2026-09-15T01:00:00.000Z',
          authorization: { authorizationCode: 'AUTH_123', last4: '4084', cardType: 'visa' },
          customerEmail: 'ada@example.com',
        }),
        chargeAuthorization: async () => {
          throw new Error('not called');
        },
        verifyWebhookSignature: () => false,
      },
    });

    const captured = await captureCharge({ reference: 'mojo_ch_1', nowIso: BASE.nowIso });

    expect(captured.status).toBe('captured');
    expect(captured.paymentMethodId).not.toBe('');
    expect(saved).toHaveLength(1);
    expect(saved[0]?.authorizationCode).toBe('AUTH_123');
  });

  it('is idempotent for replays and marks failures', async () => {
    const charges = fakeCharges([
      { ...pendingCharge(), status: 'captured', paymentMethodId: 'pm_1' },
    ]);
    const { methods } = fakeMethods();
    const captureCharge = makeCaptureCharge({
      charges,
      methods,
      collect: {
        initialize: async () => {
          throw new Error('not called');
        },
        verify: async () => {
          throw new Error('must not verify a settled charge');
        },
        chargeAuthorization: async () => {
          throw new Error('not called');
        },
        verifyWebhookSignature: () => false,
      },
    });

    const replayed = await captureCharge({ reference: 'mojo_ch_1', nowIso: BASE.nowIso });
    expect(replayed.status).toBe('captured');

    await expect(captureCharge({ reference: 'missing', nowIso: BASE.nowIso })).rejects.toThrow(
      UnknownReferenceError,
    );
  });

  it('marks the row failed when the rail did not approve', async () => {
    const charges = fakeCharges([pendingCharge()]);
    const { methods } = fakeMethods();
    const captureCharge = makeCaptureCharge({
      charges,
      methods,
      collect: {
        initialize: async () => {
          throw new Error('not called');
        },
        verify: async () => ({
          reference: 'mojo_ch_1',
          status: 'abandoned',
          amountMinor: 0,
          currency: 'NGN',
          paidAt: null,
          authorization: null,
          customerEmail: null,
        }),
        chargeAuthorization: async () => {
          throw new Error('not called');
        },
        verifyWebhookSignature: () => false,
      },
    });

    await expect(captureCharge({ reference: 'mojo_ch_1', nowIso: BASE.nowIso })).rejects.toThrow(
      ChargeNotCapturedError,
    );
    expect(charges.saved[0]?.status).toBe('failed');
  });
});
