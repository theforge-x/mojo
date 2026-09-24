export function formatMinor(amountMinor: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amountMinor / 100);
}

const DISPLAY_LOCALE = 'en-NG';
const DAY_TIMEZONE = 'Africa/Lagos';
const DAY_PARTS = { weekday: 'short', month: 'short', day: 'numeric' } as const;
const TIME_PARTS = { hour: '2-digit', minute: '2-digit' } as const;

export function formatWhen(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = start.toLocaleDateString(DISPLAY_LOCALE, { ...DAY_PARTS, timeZone: DAY_TIMEZONE });
  const startTime = start.toLocaleTimeString(DISPLAY_LOCALE, {
    ...TIME_PARTS,
    timeZone: DAY_TIMEZONE,
  });
  const endTime = end.toLocaleTimeString(DISPLAY_LOCALE, { ...TIME_PARTS, timeZone: DAY_TIMEZONE });
  return `${day} ${startTime}–${endTime}`;
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(DISPLAY_LOCALE, {
    ...TIME_PARTS,
    timeZone: DAY_TIMEZONE,
  });
}
