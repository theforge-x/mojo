import type { PrismaClient } from '@prisma/client';
import type { TutorPerformanceRepository } from '../domain/tutor-performance.ports';
import type { TutorPerformance } from '../domain/tutor-performance.types';

export class PrismaTutorPerformanceRepository implements TutorPerformanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTutorId(tutorId: string): Promise<TutorPerformance | null> {
    const row = await this.prisma.tutorPerformance.findUnique({ where: { tutorId } });
    if (!row) return null;
    return {
      tutorId: row.tutorId,
      level: row.level,
      cumulativeHoursTaught: row.cumulativeHoursTaught,
      responseTimeMinutesAvg: row.responseTimeMinutesAvg,
      trialToPaidConversionRate: row.trialToPaidConversionRate,
      cancellationRate: row.cancellationRate,
      averageRating: row.averageRating,
    };
  }

  async save(perf: TutorPerformance): Promise<void> {
    await this.prisma.tutorPerformance.upsert({
      where: { tutorId: perf.tutorId },
      create: {
        tutorId: perf.tutorId,
        level: perf.level,
        cumulativeHoursTaught: perf.cumulativeHoursTaught,
        responseTimeMinutesAvg: perf.responseTimeMinutesAvg,
        trialToPaidConversionRate: perf.trialToPaidConversionRate,
        cancellationRate: perf.cancellationRate,
        averageRating: perf.averageRating,
      },
      update: {
        level: perf.level,
        cumulativeHoursTaught: perf.cumulativeHoursTaught,
        responseTimeMinutesAvg: perf.responseTimeMinutesAvg,
        trialToPaidConversionRate: perf.trialToPaidConversionRate,
        cancellationRate: perf.cancellationRate,
        averageRating: perf.averageRating,
      },
    });
  }
}
