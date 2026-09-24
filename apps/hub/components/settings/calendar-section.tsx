import { Badge, Button } from '@mojo/shared/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function TutorCalendar({
  timezone,
  bufferMinutes,
  minimumNoticeMinutes,
  paused,
  ruleCount,
}: {
  timezone: string;
  bufferMinutes: number;
  minimumNoticeMinutes: number;
  paused: boolean;
  ruleCount: number;
}) {
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Timezone
          </dt>
          <dd className="mt-1 font-medium text-headline">{timezone}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Weekly windows
          </dt>
          <dd className="mt-1 font-medium text-headline">{ruleCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Buffer / minimum notice
          </dt>
          <dd className="mt-1 font-medium text-headline">
            {bufferMinutes} min / {minimumNoticeMinutes} min
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            New bookings
          </dt>
          <dd className="mt-1">
            <Badge variant={paused ? 'secondary' : 'primary'}>{paused ? 'Paused' : 'Open'}</Badge>
          </dd>
        </div>
      </dl>
      <Link href="/tutor/availability">
        <Button variant="outline" size="sm">
          Manage availability
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </Link>
    </div>
  );
}

export function StudentCalendar({
  timezone,
  upcomingCount,
}: {
  timezone: string;
  upcomingCount: number;
}) {
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Timezone
          </dt>
          <dd className="mt-1 font-medium text-headline">{timezone}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Upcoming lessons
          </dt>
          <dd className="mt-1 font-medium text-headline">{upcomingCount}</dd>
        </div>
      </dl>
      <p className="max-w-prose text-sm text-muted-foreground">
        Lesson times always render in {timezone}. Your week view lives on your home dashboard.
      </p>
      <Link href="/">
        <Button variant="outline" size="sm">
          View your week
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </Link>
    </div>
  );
}
