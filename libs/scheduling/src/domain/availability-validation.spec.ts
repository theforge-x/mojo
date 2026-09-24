import { describe, expect, it } from 'vitest';
import type { AvailabilityException, AvailabilityRule } from './availability.types';
import {
  exceptionBlocks,
  extraWindowCovers,
  fitsAvailability,
  tutorLocalTime,
  utcInstantForTutorLocal,
  withinRecurringRule,
} from './availability-validation';

describe('tutorLocalTime', () => {
  it('maps a UTC instant to Lagos local weekday + minute + date key', () => {
    // 2026-09-02T08:00:00Z = 09:00 WAT (UTC+1), a Wednesday.
    const local = tutorLocalTime('2026-09-02T08:00:00.000Z', 'Africa/Lagos');
    expect(local.dateKey).toBe('2026-09-02');
    expect(local.weekday).toBe(3);
    expect(local.minutes).toBe(9 * 60);
  });
});

describe('utcInstantForTutorLocal', () => {
  it('is the exact inverse of tutorLocalTime in a fixed-offset zone', () => {
    const utc = utcInstantForTutorLocal('2026-09-02', 9 * 60, 'Africa/Lagos');
    expect(utc.toISOString()).toBe('2026-09-02T08:00:00.000Z');
  });

  it('round-trips a slot across midnight', () => {
    const slot = utcInstantForTutorLocal('2026-09-02', 23 * 60 + 30, 'Africa/Lagos');
    const back = tutorLocalTime(slot.toISOString(), 'Africa/Lagos');
    expect(back.dateKey).toBe('2026-09-02');
    expect(back.minutes).toBe(23 * 60 + 30);
  });
});

const RULES: AvailabilityRule[] = [
  { id: 'r1', tutorId: 't_1', weekday: 3, startMinute: 9 * 60, endMinute: 17 * 60 },
];

describe('exceptionBlocks / extraWindowCovers / withinRecurringRule / fitsAvailability', () => {
  const at = (hour: number) => ({
    startIso: `2026-09-02T${String(hour - 1).padStart(2, '0')}:00:00.000Z`, // Lagos: UTC+1
    endIso: `2026-09-02T${String(hour - 1 + 1).padStart(2, '0')}:00:00.000Z`,
  });

  it('blocks a window overlapped by a blocked exception', () => {
    const block: AvailabilityException = {
      id: 'x',
      tutorId: 't_1',
      date: '2026-09-02',
      kind: 'blocked',
      startMinute: 11 * 60,
      endMinute: 12 * 60,
    };
    expect(exceptionBlocks(at(11), 'Africa/Lagos', [block])).toBe(true);
    expect(exceptionBlocks(at(12), 'Africa/Lagos', [block])).toBe(false);
  });

  it('picks the extra exception instead of the recurring rule when off it', () => {
    const extra: AvailabilityException = {
      id: 'x2',
      tutorId: 't_1',
      date: '2026-09-02',
      kind: 'extra',
      startMinute: 18 * 60,
      endMinute: 20 * 60,
    };
    expect(withinRecurringRule(at(19), 'Africa/Lagos', RULES)).toBe(false);
    expect(extraWindowCovers(at(19), 'Africa/Lagos', [extra])).toBe(true);
    expect(fitsAvailability(at(19), 'Africa/Lagos', RULES, [extra])).toBe(true);
  });

  it('rejects when simultaneously blocked despite a covering rule', () => {
    const block: AvailabilityException = {
      id: 'x3',
      tutorId: 't_1',
      date: '2026-09-02',
      kind: 'blocked',
      startMinute: 10 * 60,
      endMinute: 11 * 60,
    };
    expect(fitsAvailability(at(10), 'Africa/Lagos', RULES, [block])).toBe(false);
  });

  it('accepts a window inside the recurring rule with no exceptions', () => {
    expect(fitsAvailability(at(12), 'Africa/Lagos', RULES, [])).toBe(true);
  });
});
