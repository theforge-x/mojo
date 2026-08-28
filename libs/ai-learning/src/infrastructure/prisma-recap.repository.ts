import type { PrismaClient } from '@prisma/client';
import type { RecapRepository } from '../domain/ai-learning.ports';
import type { LessonRecap } from '../domain/ai-learning.types';

export class PrismaRecapRepository implements RecapRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySession(sessionId: string): Promise<LessonRecap | null> {
    const row = await this.prisma.lessonRecap.findUnique({ where: { sessionId } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(recap: LessonRecap): Promise<void> {
    await this.prisma.lessonRecap.upsert({
      where: { sessionId: recap.sessionId },
      create: {
        sessionId: recap.sessionId,
        summary: recap.summary,
        focusAreas: [...recap.focusAreas],
        generatedAt: new Date(recap.generatedAt),
        reviewedByTutor: recap.reviewedByTutor,
      },
      update: { summary: recap.summary, focusAreas: [...recap.focusAreas], reviewedByTutor: recap.reviewedByTutor },
    });
  }

  private toDomain(row: {
    sessionId: string;
    summary: string;
    focusAreas: string[];
    generatedAt: Date;
    reviewedByTutor: boolean;
  }): LessonRecap {
    return {
      sessionId: row.sessionId,
      summary: row.summary,
      focusAreas: row.focusAreas,
      generatedAt: row.generatedAt.toISOString(),
      reviewedByTutor: row.reviewedByTutor,
    };
  }
}
