/**
 * Curated IANA timezones for the tutor application/settings flows. Kept as a
 * fixed list so the wizard renders a predictable Select rather than the full
 * ~400-entry IANA table. `Africa/Lagos` (Mojo's default) sits at the top.
 */
export const TIMEZONES: readonly string[] = [
  'Africa/Lagos',
  'Africa/Abuja',
  'Africa/Accra',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Lagos',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const SUPPORTED = new Set(TIMEZONES);

export function isValidTimezone(value: string): boolean {
  if (SUPPORTED.has(value)) return true;
  try {
    // Fall back to the browser/Node IANA table for zones outside the curated list.
    if (typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone').includes(value as never);
    }
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}
