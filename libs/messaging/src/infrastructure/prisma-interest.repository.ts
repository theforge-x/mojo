import type { PrismaClient } from '@prisma/client';
import type { InterestRepository } from '../domain/messaging.ports';
import type { TutorInterest } from '../domain/messaging.types';

export class PrismaInterestRepository implements InterestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find(studentId: string, tutorId: string): Promise<TutorInterest | null> {
    const row = await this.prisma.tutorInterest.findUnique({
      where: { studentId_tutorId: { studentId, tutorId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async record(interest: TutorInterest): Promise<void> {
    await this.prisma.tutorInterest.upsert({
      where: {
        studentId_tutorId: { studentId: interest.studentId, tutorId: interest.tutorId },
      },
      create: {
        id: interest.id,
        studentId: interest.studentId,
        tutorId: interest.tutorId,
        source: interest.source,
        createdAt: new Date(interest.createdAt),
      },
      update: {
        source: interest.source,
        createdAt: new Date(interest.createdAt),
      },
    });
  }

  async forTutor(tutorId: string): Promise<TutorInterest[]> {
    const rows = await this.prisma.tutorInterest.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: {
    id: string;
    studentId: string;
    tutorId: string;
    source: string;
    createdAt: Date;
  }): TutorInterest {
    return {
      id: row.id,
      studentId: row.studentId,
      tutorId: row.tutorId,
      source: row.source === 'search' ? 'search' : 'view',
      createdAt: row.createdAt.toISOString(),
    };
  }
}
