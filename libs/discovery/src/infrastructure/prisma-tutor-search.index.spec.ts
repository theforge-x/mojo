import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PrismaTutorSearchIndex } from './prisma-tutor-search.index';

function stubPrisma(
  subscriptions: { tutorId: string; status: string; customSegmentRateMinor: number | null }[],
) {
  return {
    tutorProfile: {
      findMany: async () => [
        {
          tutorId: 't_custom',
          displayName: 'Custom C.',
          photoUrl: '',
          education: '',
          timezone: 'Africa/Lagos',
          subjects: ['Maths'],
          languages: ['English'],
          introVideoUrl: '',
        },
        {
          tutorId: 't_plain',
          displayName: 'Plain P.',
          photoUrl: '',
          education: '',
          timezone: 'Africa/Lagos',
          subjects: ['Maths'],
          languages: ['English'],
          introVideoUrl: '',
        },
      ],
    },
    tutorPerformance: {
      findMany: async () => [
        { tutorId: 't_custom', level: 'entry', averageRating: 5, responseTimeMinutesAvg: 10 },
        { tutorId: 't_plain', level: 'entry', averageRating: 5, responseTimeMinutesAvg: 10 },
      ],
    },
    mojoPlusSubscription: {
      // Faithful stub: honors the active-status predicate like the real query.
      findMany: async (args: { where: { tutorId: { in: string[] }; status?: string } }) =>
        subscriptions.filter(
          (s) =>
            args.where.tutorId.in.includes(s.tutorId) &&
            (args.where.status === undefined || s.status === args.where.status),
        ),
    },
  } as unknown as PrismaClient;
}

describe('PrismaTutorSearchIndex custom-rate overlay', () => {
  it('shows the active custom rate instead of the level default', async () => {
    const index = new PrismaTutorSearchIndex(
      stubPrisma([{ tutorId: 't_custom', status: 'active', customSegmentRateMinor: 1_000_000 }]),
    );
    const results = await index.search({});
    expect(results.find((r) => r.tutorId === 't_custom')?.perSegmentMinor).toBe(1_000_000);
    // Entry default is ₦4,000/segment.
    expect(results.find((r) => r.tutorId === 't_plain')?.perSegmentMinor).toBe(400_000);
  });

  it('ignores cancelled subscriptions and null custom rates', async () => {
    const index = new PrismaTutorSearchIndex(
      stubPrisma([
        { tutorId: 't_custom', status: 'cancelled', customSegmentRateMinor: 1_000_000 },
        { tutorId: 't_plain', status: 'active', customSegmentRateMinor: null },
      ]),
    );
    const results = await index.search({});
    expect(results.find((r) => r.tutorId === 't_custom')?.perSegmentMinor).toBe(400_000);
    expect(results.find((r) => r.tutorId === 't_plain')?.perSegmentMinor).toBe(400_000);
  });
});
