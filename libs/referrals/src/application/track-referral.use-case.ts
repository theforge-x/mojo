import { eventBus } from '@mojo/shared/events';
import type { ReferralRepository } from '../domain/referrals.ports';
import type { ReferralConversion } from '../domain/referrals.types';

export class ReferralAlreadyTrackedError extends Error {
  constructor(code: string, newUserId: string) {
    super(`Conversion for referral ${code} by user ${newUserId} was already tracked.`);
  }
}

export function makeTrackReferralConversion(deps: { referrals: ReferralRepository }) {
  return async function trackReferralConversion(conversion: ReferralConversion): Promise<void> {
    const existing = await deps.referrals.findConversion(conversion.code, conversion.newUserId);
    if (existing) throw new ReferralAlreadyTrackedError(conversion.code, conversion.newUserId);

    await deps.referrals.saveConversion(conversion);
    await eventBus.publish({
      name: 'ReferralConverted',
      occurredAt: conversion.convertedAt,
      payload: { code: conversion.code, newUserId: conversion.newUserId },
    });
  };
}
