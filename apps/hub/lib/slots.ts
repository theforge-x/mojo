import type { AvailabilityRule, SchedulingSettings } from '@mojo/scheduling/domain';

export interface BookableSlot {
  readonly startIso: string;
  readonly endIso: string;
}

const SLOT_LENGTH_MINUTES = 30;

/**
 * Expands weekly availability rules into concrete bookable ISO slots for the
 * coming N days, skipping anything inside the minimum-notice window. Used by
 * the student "book a lesson" flow; booking itself is still validated by
 * @mojo/scheduling (conflicts, buffer, notice) at the composition root.
 */
export function bookableSlots(
  rules: AvailabilityRule[],
  settings: SchedulingSettings,
  options: { days?: number; minutesStep?: number; fromIso?: string } = {},
): BookableSlot[] {
  const {
    days = 7,
    minutesStep = SLOT_LENGTH_MINUTES,
    fromIso = new Date().toISOString(),
  } = options;
  const from = new Date(fromIso);
  const earliestStartMs = from.getTime() + settings.minimumNoticeMinutes * 60_000;
  const todayKey = dayKey(from);

  const ruleByWeekday = new Map<number, AvailabilityRule[]>();
  for (const rule of rules) {
    const list = ruleByWeekday.get(rule.weekday) ?? [];
    list.push(rule);
    ruleByWeekday.set(rule.weekday, list);
  }

  const slots: BookableSlot[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(from);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + offset);
    const weekday = day.getDay();
    const dateKey = dayKey(day);

    for (const rule of ruleByWeekday.get(weekday) ?? []) {
      if (dateKey === todayKey) {
        // Only render windows that start at or after the future-most boundary.
        for (
          let minute = Math.max(rule.startMinute, minutesTo(earliestStartMs));
          minute + SLOT_LENGTH_MINUTES <= rule.endMinute;
          minute += minutesStep
        ) {
          pushSlot(slots, day, minute);
        }
      } else {
        for (
          let minute = rule.startMinute;
          minute + SLOT_LENGTH_MINUTES <= rule.endMinute;
          minute += minutesStep
        ) {
          pushSlot(slots, day, minute);
        }
      }
    }
  }

  return slots;
}

function pushSlot(slots: BookableSlot[], day: Date, startMinute: number): void {
  const start = new Date(day);
  start.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + SLOT_LENGTH_MINUTES);
  slots.push({ startIso: start.toISOString(), endIso: end.toISOString() });
}

function minutesTo(isoMs: number): number {
  const d = new Date(isoMs);
  return d.getHours() * 60 + d.getMinutes();
}

function dayKey(d: Date): string {
  const key = new Date(d);
  key.setHours(0, 0, 0, 0);
  return key.toISOString();
}
