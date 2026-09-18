import type { TutorLevel } from '@mojo/shared/domain';
import type { StudentCharge } from '../domain/charge.types';
import type {
  ChargeRateReader,
  ChargeRepository,
  PaymentCollector,
  StudentPaymentMethodRepository,
} from '../domain/payments.ports';
import { makeQuoteSessionCharge } from './quote-session-charge.use-case';

export interface InitializeChargeInput {
  studentId: string;
  tutorId: string;
  sessionId: string;
  startIso: string;
  endIso: string;
  isTrial: boolean;
  customerEmail: string;
  callbackUrl: string;
}

export class PendingChargeExistsError extends Error {
  constructor(sessionId: string) {
    super(`Session ${sessionId} already has a charge in flight.`);
  }
}

/**
 * Starts a redirect payment: books a `pending` ledger row and opens a
 * Paystack transaction for it. Reuses the pending row when the student
 * retries the same session, so refreshes never double-charge.
 */
export function makeInitializeCharge(deps: {
  charges: ChargeRepository;
  rates: ChargeRateReader;
  defaults: Record<TutorLevel, number>;
  collect: PaymentCollector;
}) {
  const quoteSessionCharge = makeQuoteSessionCharge({ rates: deps.rates, defaults: deps.defaults });

  return async function initializeCharge(
    input: InitializeChargeInput & { nowIso: string },
  ): Promise<{ charge: StudentCharge; authorizationUrl: string }> {
    const existing = await deps.charges.findBySession(input.sessionId);
    if (existing) {
      if (existing.status !== 'pending') throw new PendingChargeExistsError(input.sessionId);
      const resumed = await deps.collect.initialize({
        email: input.customerEmail,
        amountMinor: existing.totalMinor,
        currency: existing.currency,
        reference: existing.providerReference ?? `mojo_${existing.id}`,
        callbackUrl: input.callbackUrl,
      });
      return { charge: existing, authorizationUrl: resumed.authorizationUrl };
    }

    const quote = await quoteSessionCharge({
      tutorId: input.tutorId,
      startIso: input.startIso,
      endIso: input.endIso,
      isTrial: input.isTrial,
    });
    const charge: StudentCharge = {
      id: crypto.randomUUID(),
      studentId: input.studentId,
      tutorId: input.tutorId,
      sessionId: input.sessionId,
      segments: quote.segments,
      perSegmentMinor: quote.perSegmentMinor,
      standardTotalMinor: quote.standardTotalMinor,
      trialDiscountMinor: quote.trialDiscountMinor,
      totalMinor: quote.totalMinor,
      currency: quote.currency,
      isTrial: input.isTrial,
      level: quote.level,
      isCustomRate: quote.isCustomRate,
      paymentMethodId: '',
      status: 'pending',
      providerReference: '',
      createdAt: input.nowIso,
    };
    const reference = `mojo_${charge.id}`;
    const opened = await deps.collect.initialize({
      email: input.customerEmail,
      amountMinor: charge.totalMinor,
      currency: charge.currency,
      reference,
      callbackUrl: input.callbackUrl,
    });
    await deps.charges.save({ ...charge, providerReference: reference });
    return {
      charge: { ...charge, providerReference: reference },
      authorizationUrl: opened.authorizationUrl,
    };
  };
}

export interface CaptureChargeInput {
  readonly reference: string;
  readonly nowIso: string;
}

export class ChargeNotCapturedError extends Error {
  constructor(reference: string) {
    super(`Payment ${reference} was not approved — no money moved.`);
  }
}

export class UnknownReferenceError extends Error {
  constructor(reference: string) {
    super(`No charge matches reference ${reference}.`);
  }
}

/**
 * Settles a redirect payment after Paystack confirms it: verifies the
 * reference, flips the row to `captured`, and stores the reusable card
 * authorization for one-click rebooking. Idempotent — replays of an already
 * captured reference return it unchanged, so webhook retries are safe.
 */
export function makeCaptureCharge(deps: {
  charges: ChargeRepository;
  methods: StudentPaymentMethodRepository;
  collect: PaymentCollector;
}) {
  return async function captureCharge(input: CaptureChargeInput): Promise<StudentCharge> {
    const charge = await deps.charges.findByReference(input.reference);
    if (!charge) throw new UnknownReferenceError(input.reference);
    if (charge.status === 'captured' || charge.status === 'partially_refunded') return charge;
    if (charge.status === 'failed') throw new ChargeNotCapturedError(input.reference);

    const verified = await deps.collect.verify(input.reference);
    if (verified.status !== 'success' || verified.amountMinor !== charge.totalMinor) {
      await deps.charges.save({ ...charge, status: 'failed' });
      throw new ChargeNotCapturedError(input.reference);
    }

    const methods = await deps.methods.findByStudent(charge.studentId);
    const authorization = verified.authorization;
    let methodId = charge.paymentMethodId;
    if (authorization) {
      const reused = methods.find((m) => m.authorizationCode === authorization.authorizationCode);
      if (reused) {
        methodId = reused.id;
      } else {
        methodId = crypto.randomUUID();
        await deps.methods.save({
          id: methodId,
          studentId: charge.studentId,
          rail: 'paystack',
          last4: authorization.last4,
          authorizationCode: authorization.authorizationCode,
          isDefault: methods.every((m) => !m.isDefault),
        });
      }
    }
    const captured: StudentCharge = {
      ...charge,
      paymentMethodId: methodId,
      status: 'captured',
    };
    await deps.charges.save(captured);
    return captured;
  };
}
