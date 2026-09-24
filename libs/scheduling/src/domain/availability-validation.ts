import type { AvailabilityException, AvailabilityRule } from './availability.types';

export interface TimeCandidate {
  readonly startIso: string;
  readonly endIso: string;
}

export interface TutorLocalTime {
  /** Day of week in the tutor's timezone, 0 = Sunday (JS Date.getDay()). */
  readonly weekday: number;
  /** Minutes since local midnight in the tutor's timezone. */
  readonly minutes: number;
  /** YYYY-MM-DD in the tutor's timezone (the key `AvailabilityException` uses). */
  readonly dateKey: string;
}

const WEEKDAY_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

/**
 * Pure, timezone-aware. Availability rules and exceptions are stored in the
 * tutor's wall-clock (0 = Sunday + minutes-since-midnight), while candidates
 * arrive as UTC instants — this converts one to the other without ever
 * misinterpreting DST: `Intl` resolves both weekday and clock minute.
 */
export function tutorLocalTime(iso: string, timezone: string): TutorLocalTime {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  ) as Record<string, string | undefined>;

  let hour = Number(parts.hour);
  if (hour === 24) hour = 0; // some engines render midnight as 24:00 with hour12:false
  const weekday = WEEKDAY_INDEX[(parts.weekday ?? '').toLowerCase()] ?? -1;
  return {
    weekday,
    minutes: hour * 60 + Number(parts.minute),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function minutesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Inverse of `tutorLocalTime`: the exact UTC instant at which the tutor's
 * wall-clock reads `dateKey` + `minutes` (minutes since local midnight).
 *
 * The preimage of "local minute X" is a one-minute-wide interval, so a plain
 * match-based search only lands *somewhere* inside it. Instead this does a
 * lower-bound search over the predicate "local clock is at-or-after the target
 * minute" and rounds the boundary to the nearest minute (boundaries always
 * fall on minute ticks), which yields the instant the minute *starts*.
 */
export function utcInstantForTutorLocal(dateKey: string, minutes: number, timezone: string): Date {
  const naive = Date.parse(`${dateKey}T00:00:00.000Z`) + minutes * 60_000;
  let lo = naive - 14 * 3600_000;
  let hi = naive + 14 * 3600_000;
  while (lo + 1 < hi) {
    const mid = Math.round((lo + hi) / 2);
    const probe = tutorLocalTime(new Date(mid).toISOString(), timezone);
    const atOrAfter =
      probe.dateKey > dateKey || (probe.dateKey === dateKey && probe.minutes >= minutes);
    if (atOrAfter) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  const boundary = Math.round(hi / 60_000) * 60_000;
  const probe = tutorLocalTime(new Date(boundary).toISOString(), timezone);
  if (probe.dateKey === dateKey && probe.minutes === minutes) return new Date(boundary);
  throw new RangeError(`no UTC instant for ${dateKey} ${minutes} in ${timezone}`);
}

/** True when a `blocked` exception on the candidate's local date overlaps it. */
export function exceptionBlocks(
  candidate: TimeCandidate,
  timezone: string,
  exceptions: readonly AvailabilityException[],
): boolean {
  const start = tutorLocalTime(candidate.startIso, timezone);
  const end = tutorLocalTime(candidate.endIso, timezone);
  return exceptions.some(
    (exception) =>
      exception.kind === 'blocked' &&
      exception.date === start.dateKey &&
      minutesOverlap(start.minutes, end.minutes, exception.startMinute, exception.endMinute),
  );
}

/** True when the candidate sits fully inside one of the tutor's recurring rules. */
export function withinRecurringRule(
  candidate: TimeCandidate,
  timezone: string,
  rules: readonly AvailabilityRule[],
): boolean {
  const start = tutorLocalTime(candidate.startIso, timezone);
  const end = tutorLocalTime(candidate.endIso, timezone);
  // Cross-midnight candidates (local weekday differs start→end) are out of
  // scope; rules are single weekday windows.
  if (start.weekday !== end.weekday) return false;
  return rules.some(
    (rule) =>
      rule.weekday === start.weekday &&
      start.minutes >= rule.startMinute &&
      end.minutes <= rule.endMinute,
  );
}

/** True when an `extra` exception on the candidate's local date covers it. */
export function extraWindowCovers(
  candidate: TimeCandidate,
  timezone: string,
  exceptions: readonly AvailabilityException[],
): boolean {
  const start = tutorLocalTime(candidate.startIso, timezone);
  const end = tutorLocalTime(candidate.endIso, timezone);
  return exceptions.some(
    (exception) =>
      exception.kind === 'extra' &&
      exception.date === start.dateKey &&
      start.minutes >= exception.startMinute &&
      end.minutes <= exception.endMinute,
  );
}

/**
 * Chair-of-truth gate for one booking window: it must not be blocked, and it
 * must be covered by a recurring rule or an extra exception.
 */
export function fitsAvailability(
  candidate: TimeCandidate,
  timezone: string,
  rules: readonly AvailabilityRule[],
  exceptions: readonly AvailabilityException[],
): boolean {
  return (
    !exceptionBlocks(candidate, timezone, exceptions) &&
    (withinRecurringRule(candidate, timezone, rules) ||
      extraWindowCovers(candidate, timezone, exceptions))
  );
}
