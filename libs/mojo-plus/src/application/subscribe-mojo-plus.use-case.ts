import { eventBus } from '@mojo/shared/events';
import type { MojoPlusRepository } from '../domain/mojo-plus.types';

export function makeSubscribeMojoPlus(deps: { subscriptions: MojoPlusRepository }) {
  return async function subscribeMojoPlus(tutorId: string, nowIso: string): Promise<void> {
    await deps.subscriptions.save({
      tutorId,
      status: 'active',
      customSegmentRateMinor: null,
      subscribedAt: nowIso,
      cancelledAt: null,
    });
    await eventBus.publish({
      name: 'MojoPlusSubscribed',
      occurredAt: nowIso,
      payload: { tutorId },
    });
  };
}

export function makeCancelMojoPlus(deps: { subscriptions: MojoPlusRepository }) {
  return async function cancelMojoPlus(tutorId: string, nowIso: string): Promise<void> {
    const existing = await deps.subscriptions.find(tutorId);
    if (!existing) return;
    await deps.subscriptions.save({ ...existing, status: 'cancelled', cancelledAt: nowIso });
    await eventBus.publish({ name: 'MojoPlusCancelled', occurredAt: nowIso, payload: { tutorId } });
  };
}

export class MojoPlusRequiredError extends Error {
  constructor() {
    super('Custom pricing requires an active Mojo+ subscription.');
  }
}

export function makeSetCustomRate(deps: { subscriptions: MojoPlusRepository }) {
  return async function setCustomRate(tutorId: string, rateMinor: number): Promise<void> {
    const existing = await deps.subscriptions.find(tutorId);
    if (existing?.status !== 'active') throw new MojoPlusRequiredError();
    await deps.subscriptions.save({ ...existing, customSegmentRateMinor: rateMinor });
  };
}
