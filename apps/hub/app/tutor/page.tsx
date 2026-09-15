import { CalendarView } from '@mojo/scheduling/feature';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import { Handshake } from 'lucide-react';
import Link from 'next/link';
import { LevelBadge } from '../../components/level-badge';
import { RequestPayoutButton } from '../../components/request-payout-button';
import { CancelSessionButton, StartSessionButton } from '../../components/session-actions';
import { NoShowButton, RecapCard } from '../../components/session-feedback';
import { SessionStatusBadge } from '../../components/session-status-badge';
import { getHub } from '../../demo/composition-root';
import { formatMinor, formatWhen } from '../../lib/format';
import { currentUser } from '../../lib/session';

export default async function TutorHome() {
  const user = await currentUser();
  if (user?.role !== 'tutor') return null;

  const hub = getHub();
  const [sessions, performance, wallet, interests] = await Promise.all([
    hub.scheduling.sessionsByTutor(user.id),
    hub.performance.byTutor(user.id),
    hub.wallet.forTutor(user.id),
    hub.interests.forTutor(user.id),
  ]);

  const upcoming = sessions.filter((s) => s.status === 'booked' || s.status === 'confirmed');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-headline">
          Hi {user.name.split(' ')[0] || user.email.split('@')[0]}
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/tutor/availability">
            <Button variant="outline" size="sm">
              Edit availability
            </Button>
          </Link>
          <RequestPayoutButton
            balanceMinor={wallet.balance.amountMinor}
            currency={wallet.balance.currency}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-extrabold text-headline">
              {upcoming.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Level</CardTitle>
          </CardHeader>
          <CardContent>
            {performance && <LevelBadge level={performance.level} />}
            {performance && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatHours(performance.cumulativeHoursTaught)} taught ·{' '}
                {performance.averageRating.toFixed(1)}★
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-extrabold text-headline">
              {formatMinor(wallet.balance.amountMinor, wallet.balance.currency)}
            </span>
          </CardContent>
        </Card>
        <Link href="/tutor/outreach">
          <Card className="h-full transition-opacity hover:opacity-90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="size-4 text-primary" />
                Outreach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-display text-3xl font-extrabold text-headline">
                {interests.length}
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="mb-3 font-display text-lg font-bold text-headline">Sessions</h2>
      <div className="mb-6 flex flex-col gap-3">
        {sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
        {await Promise.all(
          sessions.map(async (session) => {
            const recap =
              session.status === 'completed' ? await hub.recaps.latestFor(session.id) : null;
            return (
              <Card key={session.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <div className="text-sm">
                      {formatWhen(session.startIso, session.endIso)} · student{' '}
                      {session.studentId.at(-1)}
                      {session.isTrial ? ' · trial' : ''}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <SessionStatusBadge status={session.status} />
                    </div>
                    {recap && <RecapCard summary={recap.summary} focusAreas={recap.focusAreas} />}
                  </div>
                  <div className="flex items-center gap-2">
                    {(session.status === 'booked' || session.status === 'confirmed') && (
                      <>
                        <CancelSessionButton sessionId={session.id} />
                        <NoShowButton sessionId={session.id} />
                      </>
                    )}
                    {session.status === 'booked' && <StartSessionButton sessionId={session.id} />}
                    {session.status === 'confirmed' && (
                      <Link href={`/tutor/lab/${session.id}`}>
                        <Button size="sm">Open lab</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }),
        )}
      </div>

      <h2 className="mb-3 font-display text-lg font-bold text-headline">This week</h2>
      <CalendarView
        sessions={sessions.filter((s) => s.status !== 'cancelled' && s.status !== 'no_show')}
      />
    </main>
  );
}

function formatHours(hours: number): string {
  return hours >= 1000 ? `${(hours / 1000).toFixed(1)}k h` : `${hours.toFixed(0)} h`;
}
