import type { TutorLevel } from '@mojo/shared/domain';
import type { StudentCharge } from '../domain/charge.types';
import type {
  ChargeRateReader,
  ChargeRepository,
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

/**
 * Records the student's charge for a booking against their payment method.
 * In demo mode this is a stub ledger entry (captured immediately, no rail
 * call) — the record is still the source of truth for receipts and refunds.
 * Collecting through a real Paystack/Flutterwave intent is the follow-up;
 * it slots in here, before `charges.save`.
 */
export function makeChargeStudent(deps: {
  charges: ChargeRepository;
  methods: StudentPaymentMethodRepository;
  rates: ChargeRateReader;
  defaults: Record<TutorLevel, number>;
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

    if (input.isTrial) {
      const prior = await deps.charges.listByStudent(input.studentId);
      const trialUsed = prior.some(
        (c) => c.tutorId === input.tutorId && c.isTrial && c.status !== 'refunded',
      );
      if (trialUsed) throw new TrialAlreadyUsedError();
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
      paymentMethodId: method.id,
      status: 'captured',
      createdAt: input.nowIso,
    };
    await deps.charges.save(charge);
    return charge;
  };
}
