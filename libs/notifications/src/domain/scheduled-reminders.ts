import type { NotificationChannel } from './notifications.types';

/**
 * Per-channel notification preferences. Stored per user id. This module is a
 * shared-only bounded context, so the session look-ahead contract below is
 * deliberately structural — the scheduling module never appears here.
 */
export interface NotificationPreferences {
  readonly lessonReminders: boolean;
  readonly recapEmails: boolean;
  readonly marketing: boolean;
  readonly channels: readonly NotificationChannel[];
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  lessonReminders: true,
  recapEmails: true,
  marketing: false,
  channels: ['email'],
};

/** Minimal structural view of a session, mirroring the scheduling contract. */
export interface ScheduledSessionView {
  readonly sessionId: string;
  readonly tutorId: string;
  readonly studentId: string;
  readonly startIso: string;
  readonly isTrial: boolean;
}

export interface ReminderSignal {
  readonly sessionId: string;
  readonly templateId: string;
  readonly leadMinutes: number;
}

/**
 * Computes which reminder signals are due "now" for the given sessions:
 * a day-before heads-up (due within the hour the session is exactly 24h away)
 * and a t-minus-30 alert (due within the hour it sits 30m out, skipped when
 * the day-before lead has already been fired). Timezone-agnostic by design —
 * reminder windows are not a booking-domain concern and rely on UTC instants.
 */
export function dueSessionReminders(
  sessions: readonly ScheduledSessionView[],
  nowIso: string,
  prefs: NotificationPreferences,
): ReminderSignal[] {
  if (!prefs.lessonReminders) return [];
  const now = Date.parse(nowIso);
  const signals: ReminderSignal[] = [];
  for (const session of sessions) {
    const start = Date.parse(session.startIso);
    const dayBefore = start - 24 * 3600_000;
    const tMinus30 = start - 30 * 60_000;
    if (now >= dayBefore && now < dayBefore + 3600_000) {
      signals.push({
        sessionId: session.sessionId,
        templateId: 'lesson-reminder-day-before',
        leadMinutes: 24 * 60,
      });
    } else if (now >= tMinus30 && now < tMinus30 + 3600_000) {
      signals.push({
        sessionId: session.sessionId,
        templateId: 'lesson-reminder-t-minus-30',
        leadMinutes: 30,
      });
    }
  }
  return signals;
}

export type { NotificationChannel };
