import { describe, expect, it } from 'vitest';
import type { MessageRepository } from '../domain/messaging.ports';
import type { Message } from '../domain/messaging.types';
import { makeSendMessage } from './send-message.use-case';

function fakeMessages() {
  const saved: Message[] = [];
  const repo: MessageRepository = {
    findById: async (id) => saved.find((m) => m.id === id) ?? null,
    save: async (message) => {
      saved.push(message);
    },
    listBetween: async (a, b) =>
      saved.filter(
        (m) =>
          (m.senderId === a && m.recipientId === b) || (m.senderId === b && m.recipientId === a),
      ),
    listThreadsFor: async (participantId) => [
      ...new Set(
        saved.flatMap((m) => [m.senderId, m.recipientId]).filter((id) => id !== participantId),
      ),
    ],
    markRead: async (id, at) => {
      const index = saved.findIndex((m) => m.id === id);
      if (index === -1) return;
      saved[index] = { ...(saved[index] as Message), readAt: at };
    },
  };
  return { repo, all: () => saved };
}

describe('sendMessage', () => {
  it('persists the message', async () => {
    const { repo, all } = fakeMessages();
    const message: Message = {
      id: 'msg_1',
      senderId: 'st_1',
      recipientId: 't_1',
      body: 'Hi!',
      sentAt: '2026-09-01T10:00:00.000Z',
      readAt: null,
    };
    await makeSendMessage({ messages: repo })(message);
    expect(all()).toHaveLength(1);
    expect(all()[0]?.body).toBe('Hi!');
  });
});
