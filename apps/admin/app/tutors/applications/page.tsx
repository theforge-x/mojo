import {
  Avatar,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyTitle,
} from '@mojo/shared/ui';
import type { TutorApplication } from '@mojo/tutor-profile/domain';
import { ReviewButtons } from '../../../components/review-buttons';
import { getAdmin } from '../../../demo/composition-root';
import { redirect } from 'next/navigation';
import { requireAdmin } from '../../../lib/session';

export default async function ApplicationQueuePage() {
  const adminUser = await requireAdmin();
  if (!adminUser) redirect('/login');
  const admin = getAdmin();
  const applications = await admin.applications.list();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-headline">Application queue</h1>
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyTitle>No applications</EmptyTitle>
              <EmptyDescription>Applications from new tutors will show up here.</EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </main>
  );
}

function ApplicationCard({ app }: { app: TutorApplication }) {
  const displayName = app.displayName || `applicant ${app.tutorId}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Avatar name={displayName} src={app.photoUrl || undefined} size="sm" />
          <span className="truncate">
            {displayName}
            <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
              {app.subjects.join(', ')}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-prose">
          {app.education && <p className="text-xs font-medium text-foreground">{app.education}</p>}
          <p className="mt-1 text-sm text-muted-foreground">{app.bio}</p>
          <p className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="muted">{app.timezone || 'timezone unset'}</Badge>
            {app.availability.map((w) => (
              <Badge key={w.id} variant="outline">
                {windowLabel(w.weekday, w.startMinute, w.endMinute)}
              </Badge>
            ))}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            submitted {new Date(app.submittedAt).toLocaleString()}
          </p>
        </div>
        {app.status === 'pending' ? (
          <ReviewButtons applicationId={app.id} />
        ) : (
          <Badge variant={app.status === 'approved' ? 'primary' : 'muted'}>{app.status}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function windowLabel(weekday: number, startMinute: number, endMinute: number): string {
  return `${WEEKDAY_LABELS[weekday] ?? '?'} ${clock(startMinute)}–${clock(endMinute)}`;
}

function clock(minute: number): string {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
