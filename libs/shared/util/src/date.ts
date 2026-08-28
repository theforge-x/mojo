/**
 * Timezone-aware helpers. Sessions are always stored in UTC; these convert
 * to/from a tutor or student's IANA timezone for display and input only —
 * never for storage.
 */

export function toUtcIso(localDate: Date, timeZone: string): string {
  // Placeholder for a real date-fns-tz / Luxon conversion — kept intentionally
  // simple here since correctness isn't the point of this scaffold.
  const offsetMinutes = getTimezoneOffsetMinutes(timeZone, localDate);
  const utcMs = localDate.getTime() - offsetMinutes * 60_000;
  return new Date(utcMs).toISOString();
}

export function formatInTimeZone(isoUtc: string, timeZone: string, pattern = 'HH:mm'): string {
  const date = new Date(isoUtc);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: pattern.includes('HH') ? '2-digit' : undefined,
    minute: pattern.includes('mm') ? '2-digit' : undefined,
    hour12: false,
  }).format(date);
}

export function segmentsBetween(startIso: string, endIso: string, segmentMinutes = 15): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const minutes = ms / 60_000;
  return Math.ceil(minutes / segmentMinutes);
}

function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' });
  const part = dtf.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = /GMT([+-]\d+)/.exec(part);
  return match ? Number(match[1]) * 60 : 0;
}
