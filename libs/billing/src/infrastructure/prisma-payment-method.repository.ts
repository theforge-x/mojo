import type { PrismaClient } from '@prisma/client';
import type { PaymentMethodRepository } from '../domain/billing.ports';
import type { PaymentMethod } from '../domain/billing.types';

export class PrismaPaymentMethodRepository implements PaymentMethodRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByStudent(studentId: string): Promise<PaymentMethod[]> {
    const rows = await this.prisma.paymentMethod.findMany({ where: { studentId } });
    return rows.map((r) => this.toDomain(r));
  }

  async findDefault(studentId: string): Promise<PaymentMethod | null> {
    const row = await this.prisma.paymentMethod.findFirst({
      where: { studentId, isDefault: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(method: PaymentMethod): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (method.isDefault) {
        await tx.paymentMethod.updateMany({
          where: { studentId: method.studentId, isDefault: true },
          data: { isDefault: false },
        });
      }
      await tx.paymentMethod.upsert({
        where: { id: method.id },
        create: {
          id: method.id,
          studentId: method.studentId,
          rail: method.rail,
          last4: method.last4,
          isDefault: method.isDefault,
        },
        update: { rail: method.rail, last4: method.last4, isDefault: method.isDefault },
      });
    });
  }

  private toDomain(row: {
    id: string;
    studentId: string;
    rail: string;
    last4: string | null;
    isDefault: boolean;
  }): PaymentMethod {
    return {
      id: row.id,
      studentId: row.studentId,
      rail: row.rail as PaymentMethod['rail'],
      last4: row.last4,
      isDefault: row.isDefault,
    };
  }
}
