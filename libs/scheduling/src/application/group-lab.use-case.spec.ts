import { describe, expect, it } from 'vitest';
import type { GroupLab } from '../domain/group-lab.types';
import type {
  AvailabilityRepository,
  GroupLabRepository,
  SessionRepository,
} from '../domain/scheduling.ports';
import type { ScheduledSession } from '../domain/session.types';
import {
  GroupLabNotFoundError,
  GroupLabStateError,
  makeCancelGroupLab,
  makeCreateGroupLab,
  makeLockGroupLab,
} from './group-lab.use-case';

const SETTINGS = {
  tutorId: 't_1',
  timezone: 'Africa/Lagos',
  bufferMinutes: 15,
  minimumNoticeMinutes: 60,
  pausedForNewBookings: false,
};

const RULES = [{ id: 'r1', tutorId: 't_1', weekday: 1 as const, startMinute: 480, endMinute: 1020 }];

function member(id: string, status: ScheduledSession['status'] = 'booked'): ScheduledSession {
  return {
    id,
    tutorId: 't_1',
    studentId: `st_${id}`,
    startIso: '2026-09-21T10:00:00.000Z',
    endIso: '2026-09-21T11:00:00.000Z',
    status,
    isTrial: false,
    groupId: 'g_1',
    groupSize: 2,
    statusHistory: [],
  };
}

function fakes(members: ScheduledSession[] = []) {
  const groups = new Map<string, GroupLab>();
  const savedSessions: ScheduledSession[] = [];
  const groupsRepo: GroupLabRepository = {
    findById: async (id) => groups.get(id) ?? null,
    listByTutor: async (tutorId) => [...groups.values()].filter((g) => g.tutorId === tutorId),
    listOpenByTutor: async (tutorId) =>
      [...groups.values()].filter((g) => g.tutorId === tutorId && g.status === 'open'),
    save: async (group) => {
      groups.set(group.id, group);
    },
  };
  const sessions: SessionRepository = {
    getBookedSessions: async () => [],
    findById: async () => null,
    listByGroup: async () => members,
    save: async (session) => {
      savedSessions.push(session);
    },
  };
  const availability: AvailabilityRepository = {
    getRules: async () => RULES,
    saveRules: async () => {},
    getExceptions: async () => [],
    listExceptions: async () => [],
    saveExceptions: async () => {},
    getSettings: async () => SETTINGS,
    saveSettings: async () => {},
  };
  return { groupsRepo, sessions, availability, groups, savedSessions };
}

const CREATE = {
  groupId: 'g_1',
  tutorId: 't_1',
  title: 'French Conversation Club',
  startIso: '2026-09-21T10:00:00.000Z',
  endIso: '2026-09-21T11:00:00.000Z',
  maxSeats: 20,
  nowIso: '2026-09-20T10:00:00.000Z',
};

describe('createGroupLab', () => {
  it('opens a group inside availability', async () => {
    const { groupsRepo, sessions, availability } = fakes();
    const group = await makeCreateGroupLab({ groups: groupsRepo, sessions, availability })(CREATE);
    expect(group.status).toBe('open');
    expect(group.lockedSize).toBeNull();
  });

  it('rejects fewer than 2 seats', async () => {
    const { groupsRepo, sessions, availability } = fakes();
    await expect(
      makeCreateGroupLab({ groups: groupsRepo, sessions, availability })({
        ...CREATE,
        maxSeats: 1,
      }),
    ).rejects.toThrow();
  });
});

describe('lockGroupLab', () => {
  it('locks with 2+ members and backfills the final size', async () => {
    const { groupsRepo, sessions, availability } = fakes([member('s_1'), member('s_2')]);
    await makeCreateGroupLab({ groups: groupsRepo, sessions, availability })(CREATE);
    const { group, memberSessionIds } = await makeLockGroupLab({
      groups: groupsRepo,
      sessions,
    })({ groupId: 'g_1', tutorId: 't_1', nowIso: CREATE.nowIso });

    expect(group.status).toBe('locked');
    expect(group.lockedSize).toBe(2);
    expect(memberSessionIds).toEqual(['s_1', 's_2']);
  });

  it('refuses to lock a solo enrollment', async () => {
    const { groupsRepo, sessions, availability } = fakes([member('s_1')]);
    await makeCreateGroupLab({ groups: groupsRepo, sessions, availability })(CREATE);
    await expect(
      makeLockGroupLab({ groups: groupsRepo, sessions })({
        groupId: 'g_1',
        tutorId: 't_1',
        nowIso: CREATE.nowIso,
      }),
    ).rejects.toThrow(GroupLabStateError);
  });

  it('throws for unknown or foreign groups', async () => {
    const { groupsRepo, sessions } = fakes();
    await expect(
      makeLockGroupLab({ groups: groupsRepo, sessions })({
        groupId: 'missing',
        tutorId: 't_1',
        nowIso: CREATE.nowIso,
      }),
    ).rejects.toThrow(GroupLabNotFoundError);
  });
});

describe('cancelGroupLab', () => {
  it('cancels an open group', async () => {
    const { groupsRepo, sessions, availability } = fakes();
    await makeCreateGroupLab({ groups: groupsRepo, sessions, availability })(CREATE);
    const cancelled = await makeCancelGroupLab({ groups: groupsRepo, sessions })({
      groupId: 'g_1',
      tutorId: 't_1',
    });
    expect(cancelled.status).toBe('cancelled');
  });
});
