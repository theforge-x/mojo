import { type Money, money } from '@mojo/shared/domain';
import type { PrismaClient } from '@prisma/client';
import type { WalletRepository } from '../domain/payments.ports';
import type { PayoutRequest, Wallet, WalletTransaction } from '../domain/wallet.types';

export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getWallet(tutorId: string): Promise<Wallet> {
    const row = await this.prisma.wallet.findUniqueOrThrow({ where: { tutorId } });
    return { tutorId, balance: money(row.balanceMinor, 'NGN') };
  }

  async listTransactions(tutorId: string): Promise<WalletTransaction[]> {
    const rows = await this.prisma.walletTransaction.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      tutorId: row.tutorId,
      kind: row.kind as WalletTransaction['kind'],
      amount: money(row.amountMinor, 'NGN'),
      relatedSessionId: row.relatedSessionId,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async credit(
    tutorId: string,
    amount: Money,
    relatedSessionId: string | null,
  ): Promise<WalletTransaction> {
    const [, tx] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { tutorId },
        data: { balanceMinor: { increment: amount.amountMinor } },
      }),
      this.prisma.walletTransaction.create({
        data: { tutorId, kind: 'credit', amountMinor: amount.amountMinor, relatedSessionId },
      }),
    ]);
    return {
      id: tx.id,
      tutorId,
      kind: 'credit',
      amount,
      relatedSessionId,
      createdAt: tx.createdAt.toISOString(),
    };
  }

  async debit(
    tutorId: string,
    amount: Money,
    relatedSessionId: string | null,
  ): Promise<WalletTransaction> {
    const [, tx] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { tutorId },
        data: { balanceMinor: { decrement: amount.amountMinor } },
      }),
      this.prisma.walletTransaction.create({
        data: { tutorId, kind: 'payout', amountMinor: amount.amountMinor, relatedSessionId },
      }),
    ]);
    return {
      id: tx.id,
      tutorId,
      kind: 'payout',
      amount,
      relatedSessionId,
      createdAt: tx.createdAt.toISOString(),
    };
  }

  async savePayoutRequest(request: PayoutRequest): Promise<void> {
    await this.prisma.payoutRequest.create({
      data: {
        id: request.id,
        tutorId: request.tutorId,
        amountMinor: request.amount.amountMinor,
        rail: request.rail,
        status: request.status,
      },
    });
  }
}
