import type { PrismaClient } from '@prisma/client';
import type { ChargeRefund, StudentCharge } from '../domain/charge.types';
import type { ChargeRepository, ReplacementGrantRepository } from '../domain/payments.ports';
import type { ReplacementGrant } from '../domain/replacement.types';

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
        providerReference: charge.providerReference,
        createdAt: new Date(charge.createdAt),
      },
      update: {
        status: charge.status,
        providerReference: charge.providerReference,
        totalMinor: charge.totalMinor,
        trialDiscountMinor: charge.trialDiscountMinor,
        paymentMethodId: charge.paymentMethodId,
      },
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

  async findByReference(reference: string): Promise<StudentCharge | null> {
    const row = await this.prisma.studentCharge.findFirst({
      where: { providerReference: reference },
    });
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
    providerReference: string | null;
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
      providerReference: row.providerReference,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

export class PrismaReplacementGrantRepository implements ReplacementGrantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ReplacementGrant | null> {
    const row = await this.prisma.replacementGrant.findUnique({ where: { id } });
    return row ? toGrant(row) : null;
  }

  async findBySourceSession(sourceSessionId: string): Promise<ReplacementGrant | null> {
    const row = await this.prisma.replacementGrant.findUnique({ where: { sourceSessionId } });
    return row ? toGrant(row) : null;
  }

  async findRedeemedSession(sessionId: string): Promise<ReplacementGrant | null> {
    const row = await this.prisma.replacementGrant.findFirst({
      where: { redeemedSessionId: sessionId },
    });
    return row ? toGrant(row) : null;
  }

  async listByStudent(studentId: string): Promise<ReplacementGrant[]> {
    const rows = await this.prisma.replacementGrant.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toGrant);
  }

  async save(grant: ReplacementGrant): Promise<void> {
    await this.prisma.replacementGrant.upsert({
      where: { id: grant.id },
      create: {
        id: grant.id,
        studentId: grant.studentId,
        tutorId: grant.tutorId,
        sourceSessionId: grant.sourceSessionId,
        status: grant.status,
        createdAt: new Date(grant.createdAt),
        redeemedSessionId: grant.redeemedSessionId,
        redeemedAt: grant.redeemedAt ? new Date(grant.redeemedAt) : null,
      },
      update: {
        status: grant.status,
        redeemedSessionId: grant.redeemedSessionId,
        redeemedAt: grant.redeemedAt ? new Date(grant.redeemedAt) : null,
      },
    });
  }
}

function toGrant(row: {
  id: string;
  studentId: string;
  tutorId: string;
  sourceSessionId: string;
  status: string;
  createdAt: Date;
  redeemedSessionId: string | null;
  redeemedAt: Date | null;
}): ReplacementGrant {
  return {
    id: row.id,
    studentId: row.studentId,
    tutorId: row.tutorId,
    sourceSessionId: row.sourceSessionId,
    status: row.status as ReplacementGrant['status'],
    createdAt: row.createdAt.toISOString(),
    redeemedSessionId: row.redeemedSessionId,
    redeemedAt: row.redeemedAt?.toISOString() ?? null,
  };
}
