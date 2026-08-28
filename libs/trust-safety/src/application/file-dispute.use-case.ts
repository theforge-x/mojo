import { eventBus } from '@mojo/shared/events';
import type { DisputeRepository } from '../domain/trust-safety.ports';
import type { Dispute } from '../domain/trust-safety.types';

export function makeFileDispute(deps: { disputes: DisputeRepository }) {
  return async function fileDispute(dispute: Dispute): Promise<void> {
    await deps.disputes.save(dispute);
    await eventBus.publish({
      name: 'DisputeFiled',
      occurredAt: dispute.filedAt,
      payload: { sessionId: dispute.sessionId, filedBy: dispute.filedBy, reason: dispute.reason },
    });
  };
}
