import type { PrismaClient } from '@prisma/client';
import type { SubscriptionRepository } from '../domain/billing.ports';
import type { LessonSubscription } from '../domain/billing.types';

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<LessonSubscription | null> {
    const row = await this.prisma.lessonSubscription.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByStudent(studentId: string): Promise<LessonSubscription[]> {
    const rows = await this.prisma.lessonSubscription.findMany({ where: { studentId } });
    return rows.map((r) => this.toDomain(r));
  }

  async save(subscription: LessonSubscription): Promise<void> {
    await this.prisma.lessonSubscription.upsert({
      where: { id: subscription.id },
      create: {
        id: subscription.id,
        studentId: subscription.studentId,
        tutorId: subscription.tutorId,
        lessonsPerCycle: subscription.lessonsPerCycle,
        cycleLengthDays: subscription.cycleLengthDays,
        autoRenew: subscription.autoRenew,
        status: subscription.status,
      },
      update: {
        studentId: subscription.studentId,
        tutorId: subscription.tutorId,
        lessonsPerCycle: subscription.lessonsPerCycle,
        cycleLengthDays: subscription.cycleLengthDays,
        autoRenew: subscription.autoRenew,
        status: subscription.status,
      },
    });
  }

  private toDomain(row: {
    id: string;
    studentId: string;
    tutorId: string;
    lessonsPerCycle: number;
    cycleLengthDays: number;
    autoRenew: boolean;
    status: string;
  }): LessonSubscription {
    return {
      id: row.id,
      studentId: row.studentId,
      tutorId: row.tutorId,
      lessonsPerCycle: row.lessonsPerCycle,
      cycleLengthDays: row.cycleLengthDays,
      autoRenew: row.autoRenew,
      status: row.status as LessonSubscription['status'],
    };
  }
}
