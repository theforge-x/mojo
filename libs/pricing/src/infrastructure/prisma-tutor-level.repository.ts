import type { PrismaClient } from '@prisma/client';
import type { TutorLevelReader } from '../domain/pricing.ports';
import type { TutorLevel } from '../domain/pricing.types';

export class PrismaTutorLevelReader implements TutorLevelReader {
  constructor(private readonly prisma: PrismaClient) {}

  async getLevel(tutorId: string): Promise<TutorLevel> {
    const row = await this.prisma.tutorPerformance.findUniqueOrThrow({ where: { tutorId } });
    return row.level as TutorLevel;
  }

  async hasMojoPlus(tutorId: string): Promise<boolean> {
    const sub = await this.prisma.mojoPlusSubscription.findUnique({
      where: { tutorId, status: 'active' },
    });
    return sub !== null;
  }

  async getCustomRateMinor(tutorId: string): Promise<number | null> {
    const sub = await this.prisma.mojoPlusSubscription.findUnique({ where: { tutorId } });
    return sub?.customSegmentRateMinor ?? null;
  }
}
