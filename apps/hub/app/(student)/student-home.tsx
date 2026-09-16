import { CalendarView } from '@mojo/scheduling/feature';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyTitle,
} from '@mojo/shared/ui';
import Link from 'next/link';
import { CancelSessionButton, ConfirmDeliveryButton } from '../../components/session-actions';
import { RecapCard, RescheduleForm, ReviewForm } from '../../components/session-feedback';
import { SessionStatusBadge } from '../../components/session-status-badge';
import { getHub } from '../../demo/composition-root';
import { formatWhen } from '../../lib/format';
import { currentUser } from '../../lib/session';

/** The student home lives in the `(student)` route group but resolves to `/`. */

export async function StudentHome() {
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

      {next ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Next lesson</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {await label(next.tutorId)} — {formatWhen(next.startIso, next.endIso)}
            </span>
            <SessionStatusBadge status={next.status} />
            <CancelSessionButton sessionId={next.id} />
          </CardContent>
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

      <h2 className="mb-3 font-display text-lg font-bold text-headline">Your sessions</h2>
      {sessions.length === 0 ? (
        <Empty>
          <EmptyTitle>Nothing here yet</EmptyTitle>
          <EmptyDescription>Head to Find a tutor to get started.</EmptyDescription>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {(
            await Promise.all(
              sessions.map(async (session) => ({
                session,
                tutor: await label(session.tutorId),
                review:
                  session.status === 'completed'
                    ? await hub.reviews.reviewForSession(session.id)
                    : null,
                recap:
                  session.status === 'completed' ? await hub.recaps.latestFor(session.id) : null,
              })),
            )
          ).map(({ session, tutor, review, recap }) => (
            <Card key={session.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="text-sm">
                    {tutor} · {formatWhen(session.startIso, session.endIso)}
                  </div>
                  {session.status === 'completed' && !review && (
                    <p className="text-xs text-muted-foreground">Done — deliver the review.</p>
                  )}
                  {recap && <RecapCard summary={recap.summary} focusAreas={recap.focusAreas} />}
                  {session.status === 'completed' && !review && (
                    <ReviewForm sessionId={session.id} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <SessionStatusBadge status={session.status} />
                  {session.status === 'confirmed' && (
                    <Link href={`/lab/${session.id}`}>
                      <Button size="sm" variant="outline">
                        Join lab
                      </Button>
                    </Link>
                  )}
                  {session.status === 'confirmed' && (
                    <ConfirmDeliveryButton sessionId={session.id} />
                  )}
                  {(session.status === 'booked' || session.status === 'confirmed') && (
                    <CancelSessionButton sessionId={session.id} />
                  )}
                  {session.status === 'booked' && <RescheduleForm sessionId={session.id} />}
                </div>
              </CardContent>
            </Card>
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
