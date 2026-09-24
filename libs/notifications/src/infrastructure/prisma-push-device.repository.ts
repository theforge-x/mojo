import type { PrismaClient } from '@prisma/client';
import type { PushDevice, PushDeviceRepository } from '../domain/notifications.types';

export class PrismaPushDeviceRepository implements PushDeviceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(device: PushDevice): Promise<void> {
    await this.prisma.pushDevice.upsert({
      where: { userId_token: { userId: device.userId, token: device.token } },
      create: {
        userId: device.userId,
        token: device.token,
        platform: device.platform,
        createdAt: new Date(device.createdAt),
      },
      update: { platform: device.platform },
    });
  }

  async listByUser(userId: string): Promise<PushDevice[]> {
    const rows = await this.prisma.pushDevice.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      userId: row.userId,
      token: row.token,
      platform: row.platform === 'ios' ? 'ios' : 'android',
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async remove(userId: string, token: string): Promise<void> {
    await this.prisma.pushDevice
      .delete({ where: { userId_token: { userId, token } } })
      .catch(() => null);
  }
}
