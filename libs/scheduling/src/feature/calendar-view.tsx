'use client';

import { Badge } from '@mojo/shared/ui';
import type { ScheduledSession, SessionStatus } from '../domain/session.types';

const STATUS_BADGE: Record<SessionStatus, 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'muted'> = {
  booked: 'tertiary',
  confirmed: 'primary',
  completed: 'muted',
  cancelled: 'destructive',
  no_show: 'destructive',
};

export function CalendarView({ sessions }: { sessions: ScheduledSession[] }) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {sessions.map((session) => (
        <div key={session.id} className="flex items-center justify-between p-3 text-sm">
          <span>{new Date(session.startIso).toLocaleString()}</span>
          <Badge variant={STATUS_BADGE[session.status]}>{session.status.replace('_', ' ')}</Badge>
        </div>
      ))}
    </div>
  );
}
