import type { ReplacementGrantRepository } from '../domain/payments.ports';
import type { ReplacementGrant } from '../domain/replacement.types';

export interface GrantReplacementInput {
  studentId: string;
  tutorId: string;
  /** The cancelled trial session that earns the replacement. */
  sourceSessionId: string;
  nowIso: string;
}

/**
 * Banks a free rebook with the same tutor after a trial is cancelled.
 * Idempotent per source session, and a redeemed session can never mint a
 * follow-up — the replacement chain always terminates after one free lesson.
 */
export function makeGrantReplacement(deps: { grants: ReplacementGrantRepository }) {
  return async function grantReplacement(
    input: GrantReplacementInput,
  ): Promise<ReplacementGrant | null> {
    const existing = await deps.grants.findBySourceSession(input.sourceSessionId);
    if (existing) return existing;
    const redemption = await deps.grants.findRedeemedSession(input.sourceSessionId);
    if (redemption) return null;

    const grant: ReplacementGrant = {
      id: crypto.randomUUID(),
      studentId: input.studentId,
      tutorId: input.tutorId,
      sourceSessionId: input.sourceSessionId,
      status: 'granted',
      createdAt: input.nowIso,
      redeemedSessionId: null,
      redeemedAt: null,
    };
    await deps.grants.save(grant);
    return grant;
  };
}
