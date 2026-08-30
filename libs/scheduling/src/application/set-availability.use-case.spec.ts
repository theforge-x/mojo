import { describe, expect, it } from 'vitest';
import type { AvailabilityRule, SchedulingSettings } from '../domain/availability.types';
import type { AvailabilityRepository } from '../domain/scheduling.ports';
import { makeSetAvailability, makeUpdateSchedulingSettings } from './set-availability.use-case';

function fakeAvailability(initial: Partial<SchedulingSettings> = {}) {
  let rules: AvailabilityRule[] = [];
  let settings: SchedulingSettings = {
    tutorId: 't_1',
    timezone: 'Africa/Lagos',
    bufferMinutes: 15,
    minimumNoticeMinutes: 30,
    pausedForNewBookings: false,
    ...initial,
  };
  const availability: AvailabilityRepository = {
    getRules: async () => rules,
    saveRules: async (next) => {
      rules = next;
    },
    getExceptions: async () => [],
    getSettings: async () => settings,
    saveSettings: async (next) => {
      settings = next;
    },
  };
  return { availability, getRules: () => rules, getSettings: () => settings };
}

describe('setAvailability', () => {
  it('mints stable rule ids and persists them with the tutor', async () => {
    const { availability, getRules } = fakeAvailability();
    await makeSetAvailability({ availability })('t_1', [
      { weekday: 2, startMinute: 540, endMinute: 780 },
    ]);
    expect(getRules()).toEqual([
      { id: 'rule-t_1-2-540', tutorId: 't_1', weekday: 2, startMinute: 540, endMinute: 780 },
    ]);
  });
});

describe('updateSchedulingSettings', () => {
  it('persists the timezone across the same repository the engine reads', async () => {
    const { availability, getSettings } = fakeAvailability();
    const update = makeUpdateSchedulingSettings({ availability });
    await update({ tutorId: 't_1', timezone: 'Europe/London' });

    expect(getSettings()).toMatchObject({
      tutorId: 't_1',
      timezone: 'Europe/London',
      bufferMinutes: 15,
      minimumNoticeMinutes: 30,
      pausedForNewBookings: false,
    });
  });

  it('patches only the supplied fields', async () => {
    const { availability, getSettings } = fakeAvailability({ minimumNoticeMinutes: 60 });
    await makeUpdateSchedulingSettings({ availability })({
      tutorId: 't_1',
      timezone: 'America/New_York',
      bufferMinutes: 30,
    });
    expect(getSettings()).toMatchObject({
      timezone: 'America/New_York',
      bufferMinutes: 30,
      minimumNoticeMinutes: 60,
    });
  });
});
