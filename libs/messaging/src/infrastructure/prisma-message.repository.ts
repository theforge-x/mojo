import type { PrismaClient } from '@prisma/client';
import type { MessageRepository } from '../domain/messaging.ports';
import type { Message } from '../domain/messaging.types';

export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Message | null> {
    const row = await this.prisma.message.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(message: Message): Promise<void> {
    await this.prisma.message.create({
      data: {
        id: message.id,
        senderId: message.senderId,
        recipientId: message.recipientId,
        body: message.body,
        sentAt: new Date(message.sentAt),
        readAt: message.readAt ? new Date(message.readAt) : null,
      },
    });
  }

  async listBetween(participantA: string, participantB: string): Promise<Message[]> {
    const rows = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: participantA, recipientId: participantB },
          { senderId: participantB, recipientId: participantA },
        ],
      },
      orderBy: { sentAt: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async listThreadsFor(participantId: string): Promise<string[]> {
    const rows = await this.prisma.message.findMany({
      where: { OR: [{ senderId: participantId }, { recipientId: participantId }] },
      select: { senderId: true, recipientId: true },
    });
    const partners = new Set<string>();
    for (const row of rows) {
      if (row.senderId !== participantId) partners.add(row.senderId);
      if (row.recipientId !== participantId) partners.add(row.recipientId);
    }
    return [...partners];
  }

  async markRead(id: string, at: string): Promise<void> {
    await this.prisma.message.update({
      where: { id },
      data: { readAt: new Date(at) },
    });
  }

  private toDomain(row: {
    id: string;
    senderId: string;
    recipientId: string;
    body: string;
    sentAt: Date;
    readAt: Date | null;
  }): Message {
    return {
      id: row.id,
      senderId: row.senderId,
      recipientId: row.recipientId,
      body: row.body,
      sentAt: row.sentAt.toISOString(),
      readAt: row.readAt ? row.readAt.toISOString() : null,
    };
  }
}
