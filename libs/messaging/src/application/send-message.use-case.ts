import type { MessageRepository } from '../domain/messaging.ports';
import type { Message } from '../domain/messaging.types';

export function makeSendMessage(deps: { messages: MessageRepository }) {
  return async function sendMessage(message: Message): Promise<void> {
    await deps.messages.save(message);
  };
}
