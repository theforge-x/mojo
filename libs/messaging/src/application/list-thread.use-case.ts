import type { MessageRepository } from '../domain/messaging.ports';

export interface ListThreadDeps {
  readonly messages: MessageRepository;
}

export function makeListThread({ messages }: ListThreadDeps) {
  return function listThread(participantA: string, participantB: string) {
    return messages.listBetween(participantA, participantB);
  };
}

export function makeThreadsFor({ messages }: ListThreadDeps) {
  return function threadsFor(participantId: string) {
    return messages.listThreadsFor(participantId);
  };
}

export function makeMarkRead({ messages }: ListThreadDeps) {
  return function markRead(id: string, at: string) {
    return messages.markRead(id, at);
  };
}
