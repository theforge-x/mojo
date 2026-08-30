import type {
  AvailabilityException,
  AvailabilityRule,
  ScheduledSession,
  SchedulingSettings,
} from '@mojo/scheduling/domain';
import {
  exceptionBlocks,
  respectsBuffer,
  tutorLocalTime,
  utcInstantForTutorLocal,
} from '@mojo/scheduling/domain';

export interface BookableSlot {
  readonly startIso: string;
  readonly endIso: string;
}

const SLOT_LENGTH_MINUTES = 30;

/**
 * Expands weekly availability rules into concrete bookable ISO slots for the
 * coming N days. Slots are generated in the tutor's wall-clock (via
 * `utcInstantForTutorLocal`) so weekday/minutes and exception dates line up
 * exactly with the tutor's timezone, then:
 *   - "booked"/"extra" exceptions are folded in and "blocked" ones dropped;
 *   - anything before the minimum-notice boundary is skipped;
 *   - anything that would collide with an already-booked session (with the
 *     buffer window applied) is skipped.
 * Booking itself is still re-validated by @mojo/scheduling at the root.
 */
export function bookableSlots(
  rules: AvailabilityRule[],
  settings: SchedulingSettings,
  options: {
    days?: number;
    minutesStep?: number;
    fromIso?: string;
    exceptions?: AvailabilityException[];
    existingSessions?: ScheduledSession[];
  } = {},
): BookableSlot[] {
  const {
    days = 7,
    minutesStep = SLOT_LENGTH_MINUTES,
    fromIso = new Date().toISOString(),
    exceptions = [],
    existingSessions = [],
  } = options;
  const fromMs = new Date(fromIso).getTime();
  const earliestStartMs = fromMs + settings.minimumNoticeMinutes * 60_000;
  const tz = settings.timezone;
  const todayKey = tutorLocalTime(fromIso, tz).dateKey;

  const ruleByWeekday = new Map<number, AvailabilityRule[]>();
  for (const rule of rules) {
    const list = ruleByWeekday.get(rule.weekday) ?? [];
    list.push(rule);
    ruleByWeekday.set(rule.weekday, list);
  }

  const slots: BookableSlot[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const dateKey = dateKeyPlus(todayKey, offset);
    const weekday = weekdayOfDateKey(dateKey, tz);
    const dayExceptions = exceptions.filter((e) => e.date === dateKey);

    // Base windows from the recurring rules, plus "extra" exception windows.
    const windows: Array<[number, number]> = [
      ...(ruleByWeekday.get(weekday) ?? []).map(
        (rule) => [rule.startMinute, rule.endMinute] as [number, number],
      ),
      ...dayExceptions.map((e) => [e.startMinute, e.endMinute] as [number, number]),
    ];

    for (const [startMinute, endMinute] of windows) {
      for (
        let minute = startMinute;
        minute + SLOT_LENGTH_MINUTES <= endMinute;
        minute += minutesStep
      ) {
        const startUtcMs = utcInstantForTutorLocal(dateKey, minute, tz).getTime();
        if (startUtcMs < earliestStartMs) continue;

        const slot = {
          startIso: new Date(startUtcMs).toISOString(),
          endIso: new Date(startUtcMs + SLOT_LENGTH_MINUTES * 60_000).toISOString(),
        };
        if (!fitsSlot(slot, tz, exceptions, existingSessions, settings.bufferMinutes)) {
          continue;
        }
        slots.push(slot);
      }
    }
  }

  return uniqueByStart(slots);
}

function fitsSlot(
  slot: BookableSlot,
  tz: string,
  exceptions: AvailabilityException[],
  existing: ScheduledSession[],
  bufferMinutes: number,
): boolean {
  if (exceptionBlocks(slot, tz, exceptions)) return false;
  if (existing.length > 0 && !respectsBuffer(slot, existing, bufferMinutes)) return false;
  return true;
}

function uniqueByStart(slots: BookableSlot[]): BookableSlot[] {
  const seen = new Set<string>();
  const unique: BookableSlot[] = [];
  for (const slot of slots) {
    if (seen.has(slot.startIso)) continue;
    seen.add(slot.startIso);
    unique.push(slot);
  }
  unique.sort((a, b) => a.startIso.localeCompare(b.startIso));
  return unique;
}

function dateKeyPlus(key: string, offset: number): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function weekdayOfDateKey(dateKey: string, tz: string): number {
  return tutorLocalTime(utcInstantForTutorLocal(dateKey, 0, tz).toISOString(), tz).weekday;
}
