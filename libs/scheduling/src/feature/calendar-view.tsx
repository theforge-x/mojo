'use client';

import { type CalendarEvent, WeeklyCalendar } from '@mojo/shared/ui';
import type { ScheduledSession, SessionStatus } from '../domain/session.types';

const STATUS_TEXT: Record<SessionStatus, string> = {
  booked: 'Booked',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

const STATUS_EVENT_COLOR: Record<SessionStatus, CalendarEvent['color']> = {
  booked: 'blue',
  confirmed: 'green',
  completed: 'gray',
  cancelled: 'red',
  no_show: 'red',
};

/**
 * This-week agenda rendered on the shared shadcn weekly grid. Sessions land on
 * their local day/hour; the grid only draws the current Mon–Sun window, so
 * out-of-week sessions are intentionally dropped.
 */
export function CalendarView({ sessions }: { sessions: ScheduledSession[] }) {
  const events: CalendarEvent[] = sessions.map((session) => ({
    id: session.id,
    kind: 'booking',
    title: `${STATUS_TEXT[session.status]}${session.isTrial ? ' · Trial' : ''}`,
    start: session.startIso,
    end: session.endIso,
    color: STATUS_EVENT_COLOR[session.status],
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>
          This week · {events.length} session{events.length === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-3">
          {(
            [
              ['confirmed', 'bg-blue-500/40'],
              ['booked', 'bg-emerald-500/40'],
              ['completed', 'bg-muted'],
            ] as const
          ).map(([label, swatch]) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${swatch}`} />
              {STATUS_TEXT[label as SessionStatus]}
            </span>
          ))}
        </span>
      </div>
      <WeeklyCalendar events={events} weekStart={startOfWeek(new Date())} readOnly />
    </div>
  );
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
