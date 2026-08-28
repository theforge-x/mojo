import type { Message } from './messaging.types';

export interface MessageRepository {
  findById(id: string): Promise<Message | null>;
  save(message: Message): Promise<void>;
}
