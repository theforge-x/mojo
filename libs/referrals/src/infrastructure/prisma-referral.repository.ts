import type { PrismaClient } from '@prisma/client';
import type { ReferralRepository } from '../domain/referrals.ports';
import type { ReferralConversion, ReferralLink } from '../domain/referrals.types';

export class PrismaReferralRepository implements ReferralRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findLink(code: string): Promise<ReferralLink | null> {
    const row = await this.prisma.referralLink.findUnique({ where: { code } });
    if (!row) return null;
    return {
      code: row.code,
      ownerId: row.ownerId,
      ownerRole: row.ownerRole as ReferralLink['ownerRole'],
    };
  }

  async saveLink(link: ReferralLink): Promise<void> {
    await this.prisma.referralLink.upsert({
      where: { code: link.code },
      create: { code: link.code, ownerId: link.ownerId, ownerRole: link.ownerRole },
      update: { ownerId: link.ownerId, ownerRole: link.ownerRole },
    });
  }

  async findConversion(code: string, newUserId: string): Promise<ReferralConversion | null> {
    const row = await this.prisma.referralConversion.findFirst({
      where: { code, newUserId },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async saveConversion(conversion: ReferralConversion): Promise<void> {
    await this.prisma.referralConversion.create({
      data: {
        code: conversion.code,
        newUserId: conversion.newUserId,
        convertedAt: new Date(conversion.convertedAt),
        rewardAppliedAt: conversion.rewardAppliedAt ? new Date(conversion.rewardAppliedAt) : null,
      },
    });
  }

  private toDomain(row: {
    code: string;
    newUserId: string;
    convertedAt: Date;
    rewardAppliedAt: Date | null;
  }): ReferralConversion {
    return {
      code: row.code,
      newUserId: row.newUserId,
      convertedAt: row.convertedAt.toISOString(),
      rewardAppliedAt: row.rewardAppliedAt ? row.rewardAppliedAt.toISOString() : null,
    };
  }
}
