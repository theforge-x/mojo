import { describe, expect, it } from 'vitest';
import { eventBus } from '@mojo/shared/events';
import type { ReferralConversion, ReferralLink } from '../domain/referrals.types';
import type { ReferralRepository } from '../domain/referrals.ports';
import { makeTrackReferralConversion, ReferralAlreadyTrackedError } from './track-referral.use-case';

function fakeReferrals() {
  const links: ReferralLink[] = [];
  const conversions: ReferralConversion[] = [];
  const repo: ReferralRepository = {
    findLink: async (code) => links.find((l) => l.code === code) ?? null,
    saveLink: async (link) => {
      links.push(link);
    },
    findConversion: async (code, newUserId) =>
      conversions.find((c) => c.code === code && c.newUserId === newUserId) ?? null,
    saveConversion: async (conversion) => {
      conversions.push(conversion);
    },
  };
  return { repo, conversions: () => conversions };
}

describe('trackReferralConversion', () => {
  it('records a conversion and publishes ReferralConverted', async () => {
    const { repo, conversions } = fakeReferrals();
    let captured: unknown = null;
    const unsubscribe = eventBus.subscribe('ReferralConverted', (e) => {
      captured = e;
    });
    try {
      const conversion: ReferralConversion = {
        code: 'ADAM25',
        newUserId: 'u_9',
        convertedAt: '2026-09-01T12:00:00.000Z',
        rewardAppliedAt: null,
      };
      await makeTrackReferralConversion({ referrals: repo })(conversion);
      expect(conversions()).toHaveLength(1);
      expect(captured).toMatchObject({
        name: 'ReferralConverted',
        payload: { code: 'ADAM25', newUserId: 'u_9' },
      });
    } finally {
      unsubscribe();
    }
  });

  it('rejects a conversion that was already tracked', async () => {
    const { repo } = fakeReferrals();
    const conversion: ReferralConversion = {
      code: 'ADAM25',
      newUserId: 'u_9',
      convertedAt: '2026-09-01T12:00:00.000Z',
      rewardAppliedAt: null,
    };
    await makeTrackReferralConversion({ referrals: repo })(conversion);
    await expect(makeTrackReferralConversion({ referrals: repo })(conversion)).rejects.toThrow(
      ReferralAlreadyTrackedError,
    );
  });
});
