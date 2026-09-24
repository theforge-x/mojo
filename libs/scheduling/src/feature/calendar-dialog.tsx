'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mojo/shared/ui';
import { CalendarDays } from 'lucide-react';
import type { ScheduledSession } from '../domain/session.types';
import { CalendarView } from './calendar-view';

/**
 * Weekly agenda behind a trigger button instead of an inline grid. The
 * seven-column calendar needs far more width than a dashboard column can
 * spare, so it opens in a wide modal (`This week`) on demand.
 */
export function CalendarDialog({ sessions }: { sessions: ScheduledSession[] }) {
  const visible = sessions.filter((s) => s.status !== 'cancelled' && s.status !== 'no_show');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarDays className="size-4" />
          This week · {visible.length} session{visible.length === 1 ? '' : 's'}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>This week</DialogTitle>
          <DialogDescription>
            Your Mon–Sun agenda. Sessions land on their local day and hour.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[75vh] overflow-y-auto">
          <div className="min-w-[680px]">
            <CalendarView sessions={visible} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
