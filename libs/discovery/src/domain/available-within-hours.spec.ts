import { describe, expect, it } from 'vitest';
import type { AvailabilityView } from './available-within-hours';
import { hasAvailabilityWithin } from './available-within-hours';

// 2026-09-07T09:00:00Z == 10:00 on Monday in Africa/Lagos (UTC+1).
const NOW = '2026-09-07T09:00:00.000Z';
const DOW = new Date(NOW).getUTCDay();
const TODAY = '2026-09-07';

const TZ = 'Africa/Lagos';

function view(overrides: Partial<AvailabilityView> = {}): AvailabilityView {
  return {
    timezone: TZ,
    rules: [],
    exceptions: [],
    settings: { bufferMinutes: 0, minimumNoticeMinutes: 0, pausedForNewBookings: false },
    ...overrides,
  };
}

function openWindow(startMinute: number, endMinute: number) {
  return { weekday: DOW, startMinute, endMinute };
}

describe('hasAvailabilityWithin', () => {
  it('returns true when a weekly window is open within the horizon', () => {
    const availability = view({ rules: [openWindow(540, 720)] });
    expect(hasAvailabilityWithin(availability, 1, NOW)).toBe(true);
  });

  it('returns false when there are no windows', () => {
    expect(hasAvailabilityWithin(view(), 48, NOW)).toBe(false);
  });

  it('respects minimum notice beyond the horizon', () => {
    const availability = view({
      rules: [openWindow(720, 780)],
      settings: { bufferMinutes: 0, minimumNoticeMinutes: 120, pausedForNewBookings: false },
    });
    expect(hasAvailabilityWithin(availability, 1, NOW)).toBe(false);
    expect(hasAvailabilityWithin(availability, 3, NOW)).toBe(true);
  });

  it('fails the whole window when minimum notice consumes it', () => {
    const availability = view({
      rules: [openWindow(600, 720)],
      settings: { bufferMinutes: 0, minimumNoticeMinutes: 120, pausedForNewBookings: false },
    });
    expect(hasAvailabilityWithin(availability, 3, NOW)).toBe(false);
  });

  it('honors extra exceptions as windows', () => {
    const availability = view({
      exceptions: [{ dateKey: TODAY, kind: 'extra', startMinute: 720, endMinute: 780 }],
    });
    expect(hasAvailabilityWithin(availability, 1, NOW)).toBe(false);
    expect(hasAvailabilityWithin(availability, 2, NOW)).toBe(true);
  });

  it('treats a blocked exception as removing the window', () => {
    const availability = view({
      rules: [openWindow(600, 720)],
      exceptions: [{ dateKey: TODAY, kind: 'blocked', startMinute: 600, endMinute: 720 }],
    });
    expect(hasAvailabilityWithin(availability, 2, NOW)).toBe(false);
  });

  it('lets a blocked exception carve a still-bookable sliver', () => {
    const availability = view({
      rules: [openWindow(600, 720)],
      exceptions: [{ dateKey: TODAY, kind: 'blocked', startMinute: 630, endMinute: 690 }],
    });
    expect(hasAvailabilityWithin(availability, 1, NOW)).toBe(true);
  });

  it('applies buffer windows to the start and end', () => {
    const buffered = view({
      rules: [openWindow(600, 720)],
      settings: { bufferMinutes: 30, minimumNoticeMinutes: 0, pausedForNewBookings: false },
    });
    expect(hasAvailabilityWithin(buffered, 2, NOW)).toBe(true);

    const swallowed = view({
      rules: [openWindow(600, 660)],
      settings: { bufferMinutes: 30, minimumNoticeMinutes: 0, pausedForNewBookings: false },
    });
    expect(hasAvailabilityWithin(swallowed, 4, NOW)).toBe(false);
  });

  it('returns false when the tutor paused new bookings', () => {
    const availability = view({
      rules: [openWindow(540, 720)],
      settings: { bufferMinutes: 0, minimumNoticeMinutes: 0, pausedForNewBookings: true },
    });
    expect(hasAvailabilityWithin(availability, 24, NOW)).toBe(false);
  });

  it('spans midnight and only counts windows from the next day onward', () => {
    const lateNight = '2026-09-07T22:30:00.000Z'; // 23:30 local.
    const nextWeekday = (DOW + 1) % 7;
    const availability = view({
      rules: [{ weekday: nextWeekday, startMinute: 480, endMinute: 540 }],
    });
    expect(hasAvailabilityWithin(availability, 8, lateNight)).toBe(false);
    expect(hasAvailabilityWithin(availability, 9, lateNight)).toBe(true);
  });

  it('rejects a non-positive horizon', () => {
    expect(hasAvailabilityWithin(view({ rules: [openWindow(540, 720)] }), 0, NOW)).toBe(false);
  });
});
