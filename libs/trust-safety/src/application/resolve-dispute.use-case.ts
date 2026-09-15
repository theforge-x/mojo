import { eventBus } from '@mojo/shared/events';
import type { DisputeRepository } from '../domain/trust-safety.ports';

export interface ResolveDisputeInput {
  disputeId: string;
  outcome: 'upheld' | 'dismissed';
  nowIso: string;
}

export class DisputeNotFoundError extends Error {
  constructor(id: string) {
    super(`No dispute found for id ${id}.`);
  }
}

export class DisputeAlreadyResolvedError extends Error {
  constructor(id: string) {
    super(`Dispute ${id} is already resolved.`);
  }
}

/** Closes the dispute lifecycle that `fileDispute` opens. */
export function makeResolveDispute(deps: { disputes: DisputeRepository }) {
  return async function resolveDispute(input: ResolveDisputeInput): Promise<void> {
    const dispute = await deps.disputes.findById(input.disputeId);
    if (!dispute) throw new DisputeNotFoundError(input.disputeId);
    if (dispute.status !== 'open') throw new DisputeAlreadyResolvedError(input.disputeId);

    await deps.disputes.save({ ...dispute, status: input.outcome, resolvedAt: input.nowIso });
    await eventBus.publish({
      name: 'DisputeResolved',
      occurredAt: input.nowIso,
      payload: { disputeId: dispute.id, outcome: input.outcome },
    });
  };
}
