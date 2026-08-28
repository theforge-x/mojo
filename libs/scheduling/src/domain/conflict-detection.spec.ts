import { describe, expect, it } from 'vitest';
import { hasConflict, respectsBuffer, withinNoticeWindow } from './conflict-detection';
import type { ScheduledSession } from './session.types';

function session(startIso: string, endIso: string, status: ScheduledSession['status'] = 'confirmed'): ScheduledSession {
  return {
    id: 's_1',
    tutorId: 't_1',
    studentId: 'st_1',
    startIso,
    endIso,
    status,
    isTrial: false,
    statusHistory: [],
  };
}

describe('hasConflict', () => {
  it('flags an overlapping candidate against a confirmed session', () => {
    const existing = [session('2026-09-01T10:00:00.000Z', '2026-09-01T11:00:00.000Z')];
    const candidate = { startIso: '2026-09-01T10:30:00.000Z', endIso: '2026-09-01T11:30:00.000Z' };
    expect(hasConflict(candidate, existing)).toBe(true);
  });

  it('allows a back-to-back candidate that does not overlap', () => {
    const existing = [session('2026-09-01T10:00:00.000Z', '2026-09-01T11:00:00.000Z')];
    const candidate = { startIso: '2026-09-01T11:00:00.000Z', endIso: '2026-09-01T12:00:00.000Z' };
    expect(hasConflict(candidate, existing)).toBe(false);
  });

  it('ignores a cancelled session when checking for conflicts', () => {
    const existing = [session('2026-09-01T10:00:00.000Z', '2026-09-01T11:00:00.000Z', 'cancelled')];
    const candidate = { startIso: '2026-09-01T10:30:00.000Z', endIso: '2026-09-01T11:00:00.000Z' };
    expect(hasConflict(candidate, existing)).toBe(false);
  });
});

describe('withinNoticeWindow', () => {
  it('rejects a booking inside the minimum notice window', () => {
    const now = '2026-09-01T09:50:00.000Z';
    expect(withinNoticeWindow('2026-09-01T10:00:00.000Z', now, 30)).toBe(false);
  });

  it('accepts a booking outside the minimum notice window', () => {
    const now = '2026-09-01T09:00:00.000Z';
    expect(withinNoticeWindow('2026-09-01T10:00:00.000Z', now, 30)).toBe(true);
  });
});

describe('respectsBuffer', () => {
  it('rejects a candidate that starts inside another session\'s buffer', () => {
    const existing = [session('2026-09-01T10:00:00.000Z', '2026-09-01T11:00:00.000Z')];
    // starts 5 minutes after the existing session ends, buffer requires 15
    const candidate = { startIso: '2026-09-01T11:05:00.000Z', endIso: '2026-09-01T12:00:00.000Z' };
    expect(respectsBuffer(candidate, existing, 15)).toBe(false);
  });

  it('accepts a candidate that clears the buffer on both sides', () => {
    const existing = [session('2026-09-01T10:00:00.000Z', '2026-09-01T11:00:00.000Z')];
    const candidate = { startIso: '2026-09-01T11:20:00.000Z', endIso: '2026-09-01T12:00:00.000Z' };
    expect(respectsBuffer(candidate, existing, 15)).toBe(true);
  });
});
