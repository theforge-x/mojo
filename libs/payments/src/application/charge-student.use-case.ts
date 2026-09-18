import type { TutorLevel } from '@mojo/shared/domain';
import type { StudentCharge } from '../domain/charge.types';
import type {
  ChargeRateReader,
  ChargeRepository,
  PaymentCollector,
  ReplacementGrantRepository,
  StudentPaymentMethodRepository,
} from '../domain/payments.ports';
import { makeQuoteSessionCharge } from './quote-session-charge.use-case';

export interface ChargeStudentInput {
  studentId: string;
  tutorId: string;
  sessionId: string;
  startIso: string;
  endIso: string;
  isTrial: boolean;
  /** Defaults to the student's default method when omitted. */
  paymentMethodId?: string;
  /** Customer email for the rail's receipt/fraud checks. */
  customerEmail?: string;
  /** A granted free-replacement entitlement — settles the booking at zero. */
  replacementGrantId?: string;
  nowIso: string;
}

export class NoPaymentMethodError extends Error {
  constructor() {
    super('No payment method on file — add a card before booking.');
  }
}

export class DuplicateChargeError extends Error {
  constructor(sessionId: string) {
    super(`Session ${sessionId} already has a charge.`);
  }
}

export class TrialAlreadyUsedError extends Error {
  constructor() {
    super('The trial price applies to the first lesson with a tutor only.');
  }
}

export class InvalidReplacementGrantError extends Error {
  constructor() {
    super('This free replacement is no longer available — it may already be used.');
  }
}

/**
 * Records the student's charge for a booking against their payment method.
 * Money moves through the injected `collect` rail first (Paystack
 * charge-authorization on the saved card; a stub success in demo mode), and
 * only a successful collect is persisted as `captured`. Zero-total bookings
 * (free replacements) skip the rail entirely. Anything the rail rejects
 * throws before any row is written, so the caller can release the slot.
 */
export function makeChargeStudent(deps: {
  charges: ChargeRepository;
  methods: StudentPaymentMethodRepository;
  rates: ChargeRateReader;
  defaults: Record<TutorLevel, number>;
  grants: ReplacementGrantRepository;
  collect: PaymentCollector;
}) {
  const quoteSessionCharge = makeQuoteSessionCharge({ rates: deps.rates, defaults: deps.defaults });

  return async function chargeStudent(input: ChargeStudentInput): Promise<StudentCharge> {
    const method = input.paymentMethodId
      ? ((await deps.methods.findByStudent(input.studentId)).find(
          (m) => m.id === input.paymentMethodId,
        ) ?? null)
      : await deps.methods.findDefault(input.studentId);
    if (!method) throw new NoPaymentMethodError();

    if (await deps.charges.findBySession(input.sessionId)) {
      throw new DuplicateChargeError(input.sessionId);
    }

    const grant = input.replacementGrantId
      ? await deps.grants.findById(input.replacementGrantId)
      : null;
    const grantValid =
      grant !== null &&
      grant.status === 'granted' &&
      grant.studentId === input.studentId &&
      grant.tutorId === input.tutorId;
    if (input.replacementGrantId && !grantValid) {
      throw new InvalidReplacementGrantError();
    }

    if (input.isTrial && !grant) {
      const prior = await deps.charges.listByStudent(input.studentId);
      const trialUsed = prior.some(
        (c) =>
          c.tutorId === input.tutorId &&
          c.isTrial &&
          c.status !== 'refunded' &&
          c.status !== 'failed',
      );
      if (trialUsed) throw new TrialAlreadyUsedError();
    }

    const quote = await quoteSessionCharge({
      tutorId: input.tutorId,
      startIso: input.startIso,
      endIso: input.endIso,
      isTrial: input.isTrial,
    });

    const totalMinor = grant ? 0 : quote.totalMinor;
    const chargeId = crypto.randomUUID();
    if (totalMinor > 0) {
      await deps.collect.chargeAuthorization({
        authorizationCode: method.authorizationCode ?? '',
        email: input.customerEmail ?? '',
        amountMinor: totalMinor,
        currency: quote.currency,
        reference: `mojo_${chargeId}`,
      });
    }
    const charge: StudentCharge = {
      id: chargeId,
      studentId: input.studentId,
      tutorId: input.tutorId,
      sessionId: input.sessionId,
      segments: quote.segments,
      perSegmentMinor: quote.perSegmentMinor,
      standardTotalMinor: quote.standardTotalMinor,
      trialDiscountMinor: grant ? quote.standardTotalMinor : quote.trialDiscountMinor,
      totalMinor,
      currency: quote.currency,
      isTrial: input.isTrial,
      level: quote.level,
      isCustomRate: quote.isCustomRate,
      paymentMethodId: method.id,
      status: 'captured',
      providerReference: `mojo_${chargeId}`,
      createdAt: input.nowIso,
    };
    await deps.charges.save(charge);
    if (grant) {
      await deps.grants.save({
        ...grant,
        status: 'redeemed',
        redeemedSessionId: input.sessionId,
        redeemedAt: input.nowIso,
      });
    }
    return charge;
  };
}
