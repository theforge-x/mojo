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
