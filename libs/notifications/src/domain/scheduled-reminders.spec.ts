import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  dueSessionReminders,
  type ScheduledSessionView,
} from './scheduled-reminders';

const session: ScheduledSessionView = {
  sessionId: 's_1',
  tutorId: 't_1',
  studentId: 'st_1',
  startIso: '2026-09-02T10:00:00.000Z',
  isTrial: true,
};

describe('dueSessionReminders', () => {
  it('returns nothing when reminders are disabled', () => {
    const signals = dueSessionReminders([session], '2026-09-01T09:00:00.000Z', {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      lessonReminders: false,
    });
    expect(signals).toEqual([]);
  });

  it('fires the day-before signal inside its one-hour window', () => {
    const signals = dueSessionReminders(
      [session],
      '2026-09-01T10:00:00.000Z',
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    expect(signals).toEqual([
      { sessionId: 's_1', templateId: 'lesson-reminder-day-before', leadMinutes: 1440 },
    ]);
  });

  it('fires the t-minus-30 signal inside its one-hour window', () => {
    const signals = dueSessionReminders(
      [session],
      '2026-09-02T09:45:00.000Z',
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    expect(signals).toEqual([
      { sessionId: 's_1', templateId: 'lesson-reminder-t-minus-30', leadMinutes: 30 },
    ]);
  });

  it('does not double-fire both leads for the same session', () => {
    const signals = dueSessionReminders(
      [session],
      '2026-09-02T09:00:00.000Z', // 60m out: outside both windows
      {},
    );
    expect(signals).toEqual([]);
  });

  it('ignores sessions far in the future', () => {
    const signals = dueSessionReminders(
      [session],
      '2026-08-30T10:00:00.000Z',
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    expect(signals).toEqual([]);
  });
});
