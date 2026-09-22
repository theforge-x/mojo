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
  constructor(feature = 'Custom pricing') {
    super(`${feature} requires an active Mojo+ subscription.`);
  }
}

export class InvalidCustomRateError extends Error {
  constructor() {
    super(
      `Custom rate must be between ${formatMinorBand(MIN_CUSTOM_RATE_MINOR)} and ${formatMinorBand(MAX_CUSTOM_RATE_MINOR)} per segment.`,
    );
  }
}

/** ₦500–₦200,000 per 15-minute segment — wide enough for every level, narrow enough to catch typos. */
export const MIN_CUSTOM_RATE_MINOR = 50_000;
export const MAX_CUSTOM_RATE_MINOR = 20_000_000;

function formatMinorBand(minor: number): string {
  return `₦${(minor / 100).toLocaleString('en-NG')}`;
}

export function makeSetCustomRate(deps: { subscriptions: MojoPlusRepository }) {
  return async function setCustomRate(tutorId: string, rateMinor: number): Promise<void> {
    const existing = await deps.subscriptions.find(tutorId);
    if (existing?.status !== 'active') throw new MojoPlusRequiredError();
    if (
      !Number.isInteger(rateMinor) ||
      rateMinor < MIN_CUSTOM_RATE_MINOR ||
      rateMinor > MAX_CUSTOM_RATE_MINOR
    ) {
      throw new InvalidCustomRateError();
    }
    await deps.subscriptions.save({ ...existing, customSegmentRateMinor: rateMinor });
  };
}
