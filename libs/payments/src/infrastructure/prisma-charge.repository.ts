import type { PrismaClient } from '@prisma/client';
import type { ChargeRefund, StudentCharge } from '../domain/charge.types';
import type { ChargeRepository } from '../domain/payments.ports';

export class PrismaChargeRepository implements ChargeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(charge: StudentCharge): Promise<void> {
    await this.prisma.studentCharge.upsert({
      where: { id: charge.id },
      create: {
        id: charge.id,
        studentId: charge.studentId,
        tutorId: charge.tutorId,
        sessionId: charge.sessionId,
        segments: charge.segments,
        perSegmentMinor: charge.perSegmentMinor,
        standardTotalMinor: charge.standardTotalMinor,
        trialDiscountMinor: charge.trialDiscountMinor,
        totalMinor: charge.totalMinor,
        currency: charge.currency,
        isTrial: charge.isTrial,
        level: charge.level,
        isCustomRate: charge.isCustomRate,
        paymentMethodId: charge.paymentMethodId,
        status: charge.status,
        createdAt: new Date(charge.createdAt),
      },
      update: { status: charge.status },
    });
  }

  async findById(chargeId: string): Promise<StudentCharge | null> {
    const row = await this.prisma.studentCharge.findUnique({ where: { id: chargeId } });
    return row ? this.toCharge(row) : null;
  }

  async findBySession(sessionId: string): Promise<StudentCharge | null> {
    const row = await this.prisma.studentCharge.findUnique({ where: { sessionId } });
    return row ? this.toCharge(row) : null;
  }

  async listByStudent(studentId: string): Promise<StudentCharge[]> {
    const rows = await this.prisma.studentCharge.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toCharge(row));
  }

  async saveRefund(refund: ChargeRefund): Promise<void> {
    await this.prisma.chargeRefund.create({
      data: {
        id: refund.id,
        chargeId: refund.chargeId,
        studentId: refund.studentId,
        amountMinor: refund.amountMinor,
        currency: refund.currency,
        reason: refund.reason,
        createdAt: new Date(refund.createdAt),
      },
    });
  }

  async listRefundsByStudent(studentId: string): Promise<ChargeRefund[]> {
    const rows = await this.prisma.chargeRefund.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      chargeId: row.chargeId,
      studentId: row.studentId,
      amountMinor: row.amountMinor,
      currency: row.currency as ChargeRefund['currency'],
      reason: row.reason as ChargeRefund['reason'],
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private toCharge(row: {
    id: string;
    studentId: string;
    tutorId: string;
    sessionId: string;
    segments: number;
    perSegmentMinor: number;
    standardTotalMinor: number;
    trialDiscountMinor: number;
    totalMinor: number;
    currency: string;
    isTrial: boolean;
    level: string;
    isCustomRate: boolean;
    paymentMethodId: string;
    status: string;
    createdAt: Date;
  }): StudentCharge {
    return {
      id: row.id,
      studentId: row.studentId,
      tutorId: row.tutorId,
      sessionId: row.sessionId,
      segments: row.segments,
      perSegmentMinor: row.perSegmentMinor,
      standardTotalMinor: row.standardTotalMinor,
      trialDiscountMinor: row.trialDiscountMinor,
      totalMinor: row.totalMinor,
      currency: row.currency as StudentCharge['currency'],
      isTrial: row.isTrial,
      level: row.level as StudentCharge['level'],
      isCustomRate: row.isCustomRate,
      paymentMethodId: row.paymentMethodId,
      status: row.status as StudentCharge['status'],
      createdAt: row.createdAt.toISOString(),
    };
  }
}
