import { eventBus } from '@mojo/shared/events';
import { fitsAvailability, tutorLocalTime } from '../domain/availability-validation';
import { hasConflict, withinNoticeWindow } from '../domain/conflict-detection';
import { activeMemberCount, type GroupLab } from '../domain/group-lab.types';
import type {
  AvailabilityRepository,
  GroupLabRepository,
  SessionRepository,
} from '../domain/scheduling.ports';
import { SchedulingConflictError } from './book-session.use-case';

export interface CreateGroupLabInput {
  groupId: string;
  tutorId: string;
  title: string;
  startIso: string;
  endIso: string;
  maxSeats: number;
  nowIso: string;
}

export class GroupLabNotFoundError extends Error {
  constructor(id: string) {
    super(`No group lab found for id ${id}.`);
  }
}

export class GroupLabStateError extends Error {}

function cleanTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ');
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * A tutor opens a group lab: a shared, seat-limited event inside their
 * availability that students enroll into. The group itself holds no session
 * row — each enrollment is a regular member session, so conflicts, buffers,
 * reminders, and the lab all keep working unchanged.
 */
export function makeCreateGroupLab(deps: {
  groups: GroupLabRepository;
  sessions: SessionRepository;
  availability: AvailabilityRepository;
}) {
  return async function createGroupLab(input: CreateGroupLabInput): Promise<GroupLab> {
    const title = cleanTitle(input.title);
    if (title.length < 3 || title.length > 80) {
      throw new SchedulingConflictError('give the group a title of 3–80 characters.');
    }
    if (!Number.isInteger(input.maxSeats) || input.maxSeats < 2 || input.maxSeats > 100) {
      throw new SchedulingConflictError('a group lab needs 2–100 seats.');
    }
    if (Date.parse(input.endIso) <= Date.parse(input.startIso)) {
      throw new SchedulingConflictError('the group ends before it starts.');
    }

    const settings = await deps.availability.getSettings(input.tutorId);
    if (settings.pausedForNewBookings) {
      throw new SchedulingConflictError('new bookings are paused.');
    }
    if (!withinNoticeWindow(input.startIso, input.nowIso, settings.minimumNoticeMinutes)) {
      throw new SchedulingConflictError(
        `must start at least ${settings.minimumNoticeMinutes} minutes ahead.`,
      );
    }

    const localStart = tutorLocalTime(input.startIso, settings.timezone);
    const [rules, exceptions] = await Promise.all([
      deps.availability.getRules(input.tutorId),
      deps.availability.getExceptions(input.tutorId, localStart.dateKey),
    ]);
    const candidate = { startIso: input.startIso, endIso: input.endIso };
    if (!fitsAvailability(candidate, settings.timezone, rules, exceptions)) {
      throw new SchedulingConflictError(
        "falls outside the tutor's availability or is blocked by an exception.",
      );
    }

    const [existing, openGroups] = await Promise.all([
      deps.sessions.getBookedSessions(input.tutorId, input.startIso, input.endIso),
      deps.groups.listByTutor(input.tutorId),
    ]);
    if (hasConflict(candidate, existing)) {
      throw new SchedulingConflictError('overlaps an existing session.');
    }
    if (
      openGroups.some(
        (g) => g.status === 'open' && overlaps(input.startIso, input.endIso, g.startIso, g.endIso),
      )
    ) {
      throw new SchedulingConflictError('overlaps another open group lab.');
    }

    const group: GroupLab = {
      id: input.groupId,
      tutorId: input.tutorId,
      title,
      startIso: input.startIso,
      endIso: input.endIso,
      maxSeats: input.maxSeats,
      status: 'open',
      lockedSize: null,
      createdAt: input.nowIso,
    };
    await deps.groups.save(group);
    return group;
  };
}

/**
 * Freezes enrollment and the ladder size. Member sessions are backfilled to
 * the final size so completion pricing downstream settles consistently; the
 * caller trues up already-captured charges against the same size.
 */
export function makeLockGroupLab(deps: {
  groups: GroupLabRepository;
  sessions: SessionRepository;
}) {
  return async function lockGroupLab(input: {
    groupId: string;
    tutorId: string;
    nowIso: string;
  }): Promise<{ group: GroupLab; memberSessionIds: string[] }> {
    void input.nowIso;
    const group = await deps.groups.findById(input.groupId);
    if (!group || group.tutorId !== input.tutorId) throw new GroupLabNotFoundError(input.groupId);
    if (group.status !== 'open') {
      throw new GroupLabStateError(`Group ${group.id} is ${group.status}, not open.`);
    }
    const members = await deps.sessions.listByGroup(group.id);
    const active = members.filter((m) => m.status !== 'cancelled' && m.status !== 'no_show');
    if (active.length < 2) {
      throw new GroupLabStateError('A group needs at least 2 enrolled students to lock.');
    }
    const locked: GroupLab = { ...group, status: 'locked', lockedSize: active.length };
    await deps.groups.save(locked);
    for (const member of active) {
      await deps.sessions.save({ ...member, groupSize: active.length });
    }
    await eventBus.publish({
      name: 'GroupLabLocked',
      occurredAt: input.nowIso,
      payload: { groupId: group.id, tutorId: group.tutorId, lockedSize: active.length },
    });
    return { group: locked, memberSessionIds: active.map((m) => m.id) };
  };
}

/**
 * Cancels an open group. Member bookings are left for the caller to unwind
 * through the normal session-cancel path (refunds included).
 */
export function makeCancelGroupLab(deps: {
  groups: GroupLabRepository;
  sessions: SessionRepository;
}) {
  return async function cancelGroupLab(input: {
    groupId: string;
    tutorId: string;
  }): Promise<GroupLab> {
    const group = await deps.groups.findById(input.groupId);
    if (!group || group.tutorId !== input.tutorId) throw new GroupLabNotFoundError(input.groupId);
    if (group.status !== 'open') {
      throw new GroupLabStateError(`Group ${group.id} is ${group.status}, not open.`);
    }
    const cancelled: GroupLab = { ...group, status: 'cancelled' };
    await deps.groups.save(cancelled);
    return cancelled;
  };
}

export { activeMemberCount };
