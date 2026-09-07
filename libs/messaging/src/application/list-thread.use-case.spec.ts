import { describe, expect, it } from 'vitest';
import type { MessageRepository } from '../domain/messaging.ports';
import type { Message } from '../domain/messaging.types';
import { makeListThread, makeThreadsFor } from './list-thread.use-case';

const thread: Message[] = [
  {
    id: 'm1',
    senderId: 'st_1',
    recipientId: 't_1',
    body: 'Hi!',
    sentAt: '2026-09-01T10:00:00.000Z',
    readAt: null,
  },
  {
    id: 'm2',
    senderId: 't_1',
    recipientId: 'st_1',
    body: 'Hello!',
    sentAt: '2026-09-01T10:05:00.000Z',
    readAt: null,
  },
];

function fakeMessages() {
  const saved: Message[] = [...thread];
  const repo: MessageRepository = {
    findById: async (id) => saved.find((m) => m.id === id) ?? null,
    save: async (message) => {
      saved.push(message);
    },
    listBetween: async (a, b) =>
      saved
        .filter(
          (m) =>
            (m.senderId === a && m.recipientId === b) || (m.senderId === b && m.recipientId === a),
        )
        .sort((x, y) => x.sentAt.localeCompare(y.sentAt)),
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
  return { repo };
}

describe('listThread', () => {
  it('returns the ascending conversation between two participants', async () => {
    const { repo } = fakeMessages();
    const result = await makeListThread({ messages: repo })('st_1', 't_1');
    expect(result.map((m) => m.body)).toEqual(['Hi!', 'Hello!']);
  });

  it('lists only partners the participant has exchanged messages with', async () => {
    const { repo } = fakeMessages();
    const result = await makeThreadsFor({ messages: repo })('t_1');
    expect(result).toEqual(['st_1']);
  });

  it('returns an empty thread for strangers', async () => {
    const { repo } = fakeMessages();
    const result = await makeListThread({ messages: repo })('st_2', 't_2');
    expect(result).toEqual([]);
  });
});
