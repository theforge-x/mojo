import { overlaps, type TimeRange } from '@mojo/shared/domain';
import type { ScheduledSession } from './session.types';

/**
 * Pure — this is what the roadmap meant by "conflict detection as pure
 * functions, tested separately from the DB layer." No repository, no I/O.
 */
export function hasConflict(candidate: TimeRange, existing: readonly ScheduledSession[]): boolean {
  const active = existing.filter((s) => s.status === 'booked' || s.status === 'confirmed');
  return active.some((session) =>
    overlaps(candidate, { startIso: session.startIso, endIso: session.endIso }),
  );
}

export function withinNoticeWindow(
  candidateStartIso: string,
  nowIso: string,
  minimumNoticeMinutes: number,
): boolean {
  const minutesUntilStart =
    (new Date(candidateStartIso).getTime() - new Date(nowIso).getTime()) / 60_000;
  return minutesUntilStart >= minimumNoticeMinutes;
}

export function respectsBuffer(
  candidate: TimeRange,
  existing: readonly ScheduledSession[],
  bufferMinutes: number,
): boolean {
  const active = existing.filter((s) => s.status === 'booked' || s.status === 'confirmed');
  const bufferMs = bufferMinutes * 60_000;
  return active.every((session) => {
    const paddedStart = new Date(new Date(session.startIso).getTime() - bufferMs).toISOString();
    const paddedEnd = new Date(new Date(session.endIso).getTime() + bufferMs).toISOString();
    return !overlaps(candidate, { startIso: paddedStart, endIso: paddedEnd });
  });
}
