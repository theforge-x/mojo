import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PrismaTutorLevelReader } from './prisma-tutor-level.repository';

interface SubRow {
  status: string;
  customSegmentRateMinor: number | null;
}

function stubPrisma(sub: SubRow | null, seen: { args?: unknown }) {
  return {
    tutorPerformance: {
      findUniqueOrThrow: async () => ({ level: 'entry' }),
    },
    mojoPlusSubscription: {
      // Faithful stub: honors the status predicate like the real query.
      findFirst: async (args: { where: { tutorId: string; status?: string } }) => {
        seen.args = args;
        if (!sub) return null;
        if (args.where.status !== undefined && sub.status !== args.where.status) return null;
        return sub;
      },
    },
  } as unknown as PrismaClient;
}

describe('PrismaTutorLevelReader Mojo+ rates', () => {
  it('returns the custom rate for an active subscription', async () => {
    const seen: { args?: unknown } = {};
    const reader = new PrismaTutorLevelReader(
      stubPrisma({ status: 'active', customSegmentRateMinor: 1_000_000 }, seen),
    );
    await expect(reader.getCustomRateMinor('t_1')).resolves.toBe(1_000_000);
    await expect(reader.hasMojoPlus('t_1')).resolves.toBe(true);
    expect(seen.args).toEqual({ where: { tutorId: 't_1', status: 'active' } });
  });

  it('ignores the custom rate once the subscription is cancelled', async () => {
    const seen: { args?: unknown } = {};
    const reader = new PrismaTutorLevelReader(
      stubPrisma({ status: 'cancelled', customSegmentRateMinor: 1_000_000 }, seen),
    );
    await expect(reader.getCustomRateMinor('t_1')).resolves.toBeNull();
    await expect(reader.hasMojoPlus('t_1')).resolves.toBe(false);
  });

  it('returns null without a subscription row', async () => {
    const seen: { args?: unknown } = {};
    const reader = new PrismaTutorLevelReader(stubPrisma(null, seen));
    await expect(reader.getCustomRateMinor('t_1')).resolves.toBeNull();
    await expect(reader.hasMojoPlus('t_1')).resolves.toBe(false);
  });
});
