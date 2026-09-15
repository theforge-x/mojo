import type { PrismaClient } from '@prisma/client';
import type { MojoPlusRepository } from '../domain/mojo-plus.ports';
import type { MojoPlusSubscription } from '../domain/mojo-plus.types';

export class PrismaMojoPlusRepository implements MojoPlusRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find(tutorId: string): Promise<MojoPlusSubscription | null> {
    const row = await this.prisma.mojoPlusSubscription.findUnique({ where: { tutorId } });
    if (!row) return null;
    return {
      tutorId: row.tutorId,
      status: row.status === 'cancelled' ? 'cancelled' : 'active',
      customSegmentRateMinor: row.customSegmentRateMinor,
      subscribedAt: row.subscribedAt.toISOString(),
      cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
    };
  }

  async save(subscription: MojoPlusSubscription): Promise<void> {
    await this.prisma.mojoPlusSubscription.upsert({
      where: { tutorId: subscription.tutorId },
      create: {
        tutorId: subscription.tutorId,
        status: subscription.status,
        customSegmentRateMinor: subscription.customSegmentRateMinor,
        subscribedAt: new Date(subscription.subscribedAt),
        cancelledAt: subscription.cancelledAt ? new Date(subscription.cancelledAt) : null,
      },
      update: {
        status: subscription.status,
        customSegmentRateMinor: subscription.customSegmentRateMinor,
        cancelledAt: subscription.cancelledAt ? new Date(subscription.cancelledAt) : null,
      },
    });
  }
}
