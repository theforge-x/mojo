import type { PrismaClient } from '@prisma/client';
import type { ScheduledSession } from '@mojo/scheduling/domain';
import type { BookingRepository } from '../domain/booking.ports';
import type { DeliveryConfirmation } from '../domain/session-lifecycle.types';

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(sessionId: string): Promise<ScheduledSession | null> {
    const row = await this.prisma.session.findUnique({ where: { id: sessionId }, include: { statusHistory: true } });
    if (!row) return null;
    return {
      id: row.id,
      tutorId: row.tutorId,
      studentId: row.studentId,
      startIso: row.startAt.toISOString(),
      endIso: row.endAt.toISOString(),
      status: row.status as ScheduledSession['status'],
      isTrial: row.isTrial,
      statusHistory: [],
    };
  }

  async markCompleted(sessionId: string, at: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'completed', statusHistory: { create: { status: 'completed', at: new Date(at) } } },
    });
  }

  async markNoShow(sessionId: string, by: 'student' | 'tutor', at: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'no_show', statusHistory: { create: { status: 'no_show', at: new Date(at) } } },
    });
    void by; // recorded on the dispute record, not the session itself
  }

  async saveConfirmation(confirmation: DeliveryConfirmation): Promise<void> {
    await this.prisma.deliveryConfirmation.create({
      data: {
        sessionId: confirmation.sessionId,
        confirmedBy: confirmation.confirmedBy,
        confirmedAt: new Date(confirmation.confirmedAt),
      },
    });
  }
}
