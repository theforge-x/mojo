import type { PrismaClient } from '@prisma/client';
import type { BookingRepository } from '../domain/booking.ports';
import type { BookingSession } from '../domain/booking-session.types';
import type { DeliveryConfirmation } from '../domain/session-lifecycle.types';

export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(sessionId: string): Promise<BookingSession | null> {
    const row = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!row) return null;
    return toBookingSession(row);
  }

  async listAwaitingConfirmation(endBeforeIso: string): Promise<BookingSession[]> {
    const rows = await this.prisma.session.findMany({
      where: { status: 'confirmed', endAt: { lt: new Date(endBeforeIso) } },
      orderBy: { endAt: 'asc' },
    });
    return rows.map(toBookingSession);
  }

  async markCompleted(sessionId: string, at: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        statusHistory: { create: { status: 'completed', at: new Date(at) } },
      },
    });
  }

  async markNoShow(sessionId: string, by: 'student' | 'tutor', at: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'no_show',
        statusHistory: { create: { status: 'no_show', at: new Date(at) } },
      },
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

function toBookingSession(row: {
  id: string;
  tutorId: string;
  studentId: string;
  startAt: Date;
  endAt: Date;
  isTrial: boolean;
  status: BookingSession['status'];
  groupSize: number | null;
}): BookingSession {
  return {
    id: row.id,
    tutorId: row.tutorId,
    studentId: row.studentId,
    startIso: row.startAt.toISOString(),
    endIso: row.endAt.toISOString(),
    isTrial: row.isTrial,
    status: row.status,
    groupSize: row.groupSize,
  };
}
