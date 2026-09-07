import { describe, expect, it } from 'vitest';
import type { InterestRepository } from '../domain/messaging.ports';
import type { TutorInterest } from '../domain/messaging.types';
import { makeListTutorInterests, makeRecordInterest } from './record-interest.use-case';

function fakeInterests() {
  const saved = new Map<string, TutorInterest>();
  const repo: InterestRepository = {
    find: async (studentId, tutorId) => saved.get(`${studentId}:${tutorId}`) ?? null,
    record: async (interest) => {
      saved.set(`${interest.studentId}:${interest.tutorId}`, interest);
    },
    forTutor: async (tutorId) =>
      [...saved.values()]
        .filter((i) => i.tutorId === tutorId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
  return { repo, all: () => [...saved.values()] };
}

describe('recordInterest', () => {
  it('records a new interest', async () => {
    const { repo, all } = fakeInterests();
    await makeRecordInterest({ interests: repo })({
      studentId: 'st_1',
      tutorId: 't_1',
      source: 'view',
      nowIso: '2026-09-01T10:00:00.000Z',
    });
    expect(all()).toHaveLength(1);
    expect(all()[0]?.source).toBe('view');
  });

  it('upserts so the most recent action wins', async () => {
    const { repo, all } = fakeInterests();
    const record = makeRecordInterest({ interests: repo });
    await record({
      studentId: 'st_1',
      tutorId: 't_1',
      source: 'search',
      nowIso: '2026-09-01T10:00:00.000Z',
    });
    await record({
      studentId: 'st_1',
      tutorId: 't_1',
      source: 'view',
      nowIso: '2026-09-01T11:00:00.000Z',
    });
    expect(all()).toHaveLength(1);
    expect(all()[0]?.source).toBe('view');
    expect(all()[0]?.createdAt).toBe('2026-09-01T11:00:00.000Z');
  });
});

describe('listTutorInterests', () => {
  it('lists interested students for a tutor', async () => {
    const { repo } = fakeInterests();
    const record = makeRecordInterest({ interests: repo });
    await record({
      studentId: 'st_1',
      tutorId: 't_1',
      source: 'view',
      nowIso: '2026-09-01T10:00:00.000Z',
    });
    await record({
      studentId: 'st_2',
      tutorId: 't_1',
      source: 'search',
      nowIso: '2026-09-01T11:00:00.000Z',
    });
    const result = await makeListTutorInterests({ interests: repo })('t_1');
    expect(result.map((i) => i.studentId)).toEqual(['st_2', 'st_1']);
  });
});
