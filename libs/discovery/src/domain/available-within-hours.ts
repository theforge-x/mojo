const MIN_OPEN_MINUTES = 15;

export interface AvailabilityWindowView {
  /** 0 = Sunday, matching `Date.prototype.getDay`. */
  readonly weekday: number;
  /** Minutes since local midnight. */
  readonly startMinute: number;
  readonly endMinute: number;
}

export type AvailabilityExceptionKind = 'blocked' | 'extra';

export interface AvailabilityExceptionView {
  /** Local date key `YYYY-MM-DD` in the tutor's timezone. */
  readonly dateKey: string;
  readonly kind: AvailabilityExceptionKind;
  readonly startMinute: number;
  readonly endMinute: number;
}

export interface AvailabilitySettingsView {
  readonly bufferMinutes: number;
  readonly minimumNoticeMinutes: number;
  readonly pausedForNewBookings: boolean;
}

/**
 * The dependency-inverted availability slice that `availableWithinHours`
 * needs. The discovery domain may only depend on `@mojo/shared/*` and its own
 * module, so it declares this shape locally instead of importing the
 * scheduling domain; each search index translates its own storage into it.
 */
export interface AvailabilityView {
  readonly timezone: string;
  readonly rules: readonly AvailabilityWindowView[];
  readonly exceptions: readonly AvailabilityExceptionView[];
  readonly settings: AvailabilitySettingsView | null;
}

interface LocalClock {
  readonly weekday: number;
  readonly minutes: number;
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
 * The tutor's current wall clock (weekday, minutes since local midnight, local
 * date key) for a UTC instant. Pure `Intl`, no framework. This mirrors the
 * `tutorLocalTime` helper in scheduling's domain, duplicated here so the
 * discovery domain stays isolated from other modules.
 */
function tutorLocalClock(iso: string, timezone: string): LocalClock {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  ) as Record<string, string | undefined>;
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  return {
    weekday: WEEKDAY_INDEX[(parts.weekday ?? '').toLowerCase()] ?? -1,
    minutes: hour * 60 + Number(parts.minute),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

interface MinutesInterval {
  readonly start: number;
  readonly end: number;
}

function subtractIntervals(
  open: readonly MinutesInterval[],
  blocked: readonly MinutesInterval[],
): MinutesInterval[] {
  let intervals = [...open].sort((a, b) => a.start - b.start);
  for (const block of [...blocked].sort((a, b) => a.start - b.start)) {
    const next: MinutesInterval[] = [];
    for (const interval of intervals) {
      if (block.end <= interval.start || block.start >= interval.end) {
        next.push(interval);
      } else {
        if (block.start > interval.start) next.push({ start: interval.start, end: block.start });
        if (block.end < interval.end) next.push({ start: block.end, end: interval.end });
      }
    }
    intervals = next;
  }
  return intervals;
}

/**
 * Whether the tutor has a bookable slot starting between the earliest possible
 * start (now + minimum notice, in the tutor's timezone) and the requested
 * horizon, respecting buffer windows, blocked days, and the pause switch.
 */
export function hasAvailabilityWithin(
  availability: AvailabilityView,
  horizonHours: number,
  nowIso: string = new Date().toISOString(),
): boolean {
  if (horizonHours <= 0) return false;
  if (availability.settings?.pausedForNewBookings) return false;

  const now = tutorLocalClock(nowIso, availability.timezone);
  const minimumNoticeMinutes = availability.settings?.minimumNoticeMinutes ?? 0;
  const bufferMinutes = availability.settings?.bufferMinutes ?? 0;
  const earliest = now.minutes + minimumNoticeMinutes;
  const horizon = now.minutes + horizonHours * 60;
  const dayCount = Math.floor(horizon / 1440) + 1;

  for (let day = 0; day < dayCount; day += 1) {
    const weekday = (now.weekday + day) % 7;
    const dateKey = addDays(now.dateKey, day);
    const base = day * 1440;

    const open: MinutesInterval[] = [
      ...availability.rules
        .filter((rule) => rule.weekday === weekday)
        .map((rule) => ({ start: base + rule.startMinute, end: base + rule.endMinute })),
      ...availability.exceptions
        .filter((exception) => exception.kind === 'extra' && exception.dateKey === dateKey)
        .map((exception) => ({
          start: base + exception.startMinute,
          end: base + exception.endMinute,
        })),
    ];
    const blocked: MinutesInterval[] = availability.exceptions
      .filter((exception) => exception.kind === 'blocked' && exception.dateKey === dateKey)
      .map((exception) => ({
        start: base + exception.startMinute,
        end: base + exception.endMinute,
      }));

    for (const interval of subtractIntervals(open, blocked)) {
      const start = Math.max(interval.start + bufferMinutes, earliest);
      const end = interval.end - bufferMinutes;
      if (start <= horizon && end - start >= MIN_OPEN_MINUTES) return true;
    }
  }

  return false;
}
