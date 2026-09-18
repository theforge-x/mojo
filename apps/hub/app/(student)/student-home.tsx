import { CalendarView } from '@mojo/scheduling/feature';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Empty,
  EmptyDescription,
  EmptyTitle,
} from '@mojo/shared/ui';
import { CalendarDays, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CalendarExportButton } from '../../components/calendar-export-button';
import { DisputeButton } from '../../components/dispute-button';
import { CancelSessionButton, ConfirmDeliveryButton } from '../../components/session-actions';
import {
  dayLabel,
  SessionDateTile,
  SessionGridCard,
  SessionListCard,
  type SessionView,
  toneForStatus,
} from '../../components/session-cards';
import {
  NoShowButton,
  RecapCard,
  RescheduleForm,
  ReviewForm,
} from '../../components/session-feedback';
import { SessionStatusBadge } from '../../components/session-status-badge';
import { SessionViewToggle } from '../../components/session-view-toggle';
import { GroupLabBadge } from '../../components/group-lab-badge';
import { getHub } from '../../demo/composition-root';
import { formatWhen } from '../../lib/format';
import { currentUser } from '../../lib/session';

/** The student home lives in the `(student)` route group but resolves to `/`. */

export async function StudentHome({ view }: { view: SessionView }) {
  const user = await currentUser();
  if (user?.role !== 'student') return null;

  const hub = getHub();
  const sessions = await hub.scheduling.sessionsByStudent(user.id);
  const label = async (tutorId: string) =>
    (await hub.profile.byTutor(tutorId))?.displayName ?? 'Your tutor';
  const upcoming = sessions
    .filter((s) => s.status === 'booked' || s.status === 'confirmed')
    .sort((a, b) => a.startIso.localeCompare(b.startIso));
  const next = upcoming[0] ?? null;
  const nextTutor = next ? await label(next.tutorId) : null;

  const enriched = await Promise.all(
    sessions.map(async (session) => ({
      session,
      tutor: await label(session.tutorId),
      review:
        session.status === 'completed' ? await hub.reviews.reviewForSession(session.id) : null,
      recap: session.status === 'completed' ? await hub.recaps.latestFor(session.id) : null,
      dispute:
        session.status === 'completed' || session.status === 'cancelled'
          ? await hub.trust.forSession(session.id)
          : null,
    })),
  );

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-headline">
          Hi {user.name.split(' ')[0] || user.email.split('@')[0]}
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/payments">
            <Button variant="outline">Payments</Button>
          </Link>
          <Link href="/tutors">
            <Button>Find a tutor</Button>
          </Link>
        </div>
      </div>

      {next && nextTutor ? (
        <Card className="mb-6 overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <SessionDateTile startIso={next.startIso} tone={toneForStatus(next.status)} />
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
                  Next lesson · {dayLabel(next.startIso)}
                </p>
                <p className="mt-0.5 font-display text-xl font-bold text-headline">{nextTutor}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatWhen(next.startIso, next.endIso)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ms-auto">
              <SessionStatusBadge status={next.status} />
              <CancelSessionButton sessionId={next.id} />
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent>
            <Empty>
              <EmptyTitle>No upcoming lessons</EmptyTitle>
              <EmptyDescription>Find a tutor and book your first session.</EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-headline">
          <CalendarDays className="size-5 text-primary" aria-hidden />
          Your sessions
          <span className="text-sm font-medium text-muted-foreground">({sessions.length})</span>
        </h2>
        <SessionViewToggle view={view} />
      </div>
      {sessions.length === 0 ? (
        <Empty>
          <EmptyTitle>Nothing here yet</EmptyTitle>
          <EmptyDescription>Head to Find a tutor to get started.</EmptyDescription>
        </Empty>
      ) : view === 'grid' ? (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          {enriched.map(({ session, tutor, review, recap, dispute }) => (
            <SessionGridCard
              key={session.id}
              startIso={session.startIso}
              endIso={session.endIso}
              tone={toneForStatus(session.status)}
              title={tutor}
              subtitle={session.isTrial ? 'Trial lesson' : undefined}
              badges={
              <StudentSessionBadges
                status={session.status}
                isTrial={session.isTrial}
                groupSize={session.groupSize}
              />
            }
              actions={<StudentSessionActions session={session} tutorName={tutor} />}
            >
              <StudentSessionExtras
                status={session.status}
                sessionId={session.id}
                hasReview={review !== null}
                recap={recap}
                disputeStatus={dispute?.status ?? null}
              />
            </SessionGridCard>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {enriched.map(({ session, tutor, review, recap, dispute }) => (
            <SessionListCard
              key={session.id}
              startIso={session.startIso}
              endIso={session.endIso}
              tone={toneForStatus(session.status)}
              title={tutor}
              subtitle={session.isTrial ? 'Trial lesson' : undefined}
              badges={
              <StudentSessionBadges
                status={session.status}
                isTrial={session.isTrial}
                groupSize={session.groupSize}
              />
            }
              actions={<StudentSessionActions session={session} tutorName={tutor} />}
            >
              <StudentSessionExtras
                status={session.status}
                sessionId={session.id}
                hasReview={review !== null}
                recap={recap}
                disputeStatus={dispute?.status ?? null}
              />
            </SessionListCard>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-headline">This week</h2>
      <CalendarView
        sessions={sessions.filter((s) => s.status !== 'cancelled' && s.status !== 'no_show')}
      />
    </main>
  );
}

function StudentSessionBadges({
  status,
  isTrial,
  groupSize,
}: {
  status: string;
  isTrial: boolean;
  groupSize?: number | null;
}) {
  return (
    <>
      <SessionStatusBadge status={status} />
      {typeof groupSize === 'number' && groupSize > 1 && <GroupLabBadge seats={groupSize} />}
      {isTrial && (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" aria-hidden />
          Trial
        </Badge>
      )}
    </>
  );
}

function StudentSessionActions({
  session,
  tutorName,
}: {
  session: { id: string; status: string; tutorId: string; startIso: string; endIso: string };
  tutorName: string;
}) {
  return (
    <>
      {(session.status === 'booked' || session.status === 'confirmed') && (
        <CalendarExportButton
          sessionId={session.id}
          title={`Mojo lesson with ${tutorName}`}
          startIso={session.startIso}
          endIso={session.endIso}
        />
      )}
      {session.status === 'confirmed' && (
        <Link href={`/lab/${session.id}`} className="w-full">
          <Button size="sm" variant="outline" className="w-full">
            Join lab
          </Button>
        </Link>
      )}
      {session.status === 'confirmed' && <ConfirmDeliveryButton sessionId={session.id} />}
      {(session.status === 'booked' || session.status === 'confirmed') && (
        <CancelSessionButton sessionId={session.id} />
      )}
      {session.status === 'confirmed' && <NoShowButton sessionId={session.id} />}
      {session.status === 'booked' && (
        <RescheduleForm sessionId={session.id} tutorId={session.tutorId} />
      )}
    </>
  );
}

function StudentSessionExtras({
  status,
  sessionId,
  hasReview,
  recap,
  disputeStatus,
}: {
  status: string;
  sessionId: string;
  hasReview: boolean;
  recap: { summary: string; focusAreas: readonly string[] } | null;
  disputeStatus: string | null;
}) {
  const disputable = status === 'completed' || status === 'cancelled';
  return (
    <>
      {status === 'completed' && !hasReview && (
        <p className="text-xs text-muted-foreground">Done — deliver the review.</p>
      )}
      {recap && <RecapCard summary={recap.summary} focusAreas={recap.focusAreas} />}
      {status === 'completed' && !hasReview && <ReviewForm sessionId={sessionId} />}
      {disputeStatus === 'open' && (
        <p className="text-xs font-medium text-secondary">
          Dispute open — our team is looking into this lesson.
        </p>
      )}
      {disputable && !disputeStatus && <DisputeButton sessionId={sessionId} />}
    </>
  );
}
