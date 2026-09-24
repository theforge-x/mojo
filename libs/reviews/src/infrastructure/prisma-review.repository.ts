import type { PrismaClient } from '@prisma/client';
import type { ReviewRepository } from '../domain/reviews.ports';
import type { Review } from '../domain/reviews.types';

export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Review | null> {
    const row = await this.prisma.review.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findBySession(sessionId: string): Promise<Review | null> {
    const row = await this.prisma.review.findUnique({ where: { sessionId } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(review: Review): Promise<void> {
    await this.prisma.review.upsert({
      where: { sessionId: review.sessionId },
      create: {
        id: review.id,
        sessionId: review.sessionId,
        tutorId: review.tutorId,
        studentId: review.studentId,
        rating: review.rating,
        body: review.body,
        flagged: review.flagged,
        createdAt: new Date(review.createdAt),
      },
      update: { rating: review.rating, body: review.body, flagged: review.flagged },
    });
  }

  async list(): Promise<Review[]> {
    const rows = await this.prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => this.toDomain(row));
  }

  async listByTutor(tutorId: string): Promise<Review[]> {
    const rows = await this.prisma.review.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: {
    id: string;
    sessionId: string;
    tutorId: string;
    studentId: string;
    rating: number;
    body: string;
    flagged: boolean;
    createdAt: Date;
  }): Review {
    return {
      id: row.id,
      sessionId: row.sessionId,
      tutorId: row.tutorId,
      studentId: row.studentId,
      rating: row.rating,
      body: row.body,
      flagged: row.flagged,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
