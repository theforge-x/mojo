import { CalendarView } from '@mojo/scheduling/feature';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import Link from 'next/link';
import { RequestPayoutButton } from '../../../components/request-payout-button';
import { CancelSessionButton, StartSessionButton } from '../../../components/session-actions';
import { getHub } from '../../../demo/composition-root';
import { formatMinor, formatWhen } from '../../../lib/format';
import { currentUser } from '../../../lib/session';

const LEVEL_BADGE: Record<string, 'muted' | 'primary' | 'tertiary'> = {
  entry: 'muted',
  established: 'primary',
  expert: 'tertiary',
};

export default async function TutorHome() {
  const user = await currentUser();
  if (!user || user.role !== 'tutor') return null;

  const hub = getHub();
  const [sessions, performance, wallet] = await Promise.all([
    hub.scheduling.sessionsByTutor(user.id),
    hub.performance.byTutor(user.id),
    hub.wallet.forTutor(user.id),
  ]);

  const upcoming = sessions.filter((s) => s.status === 'booked' || s.status === 'confirmed');

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-headline">
          Hi {user.email.split('@')[0]}
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            {performance && (
              <Badge variant={LEVEL_BADGE[performance.level] ?? 'muted'}>{performance.level}</Badge>
            )}
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
      </div>

      <h2 className="mb-3 font-display text-lg font-bold text-headline">Sessions</h2>
      <div className="mb-6 flex flex-col gap-3">
        {sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <div className="text-sm">
                  {formatWhen(session.startIso, session.endIso)} · student{' '}
                  {session.studentId.at(-1)}
                  {session.isTrial ? ' · trial' : ''}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={
                      session.status === 'confirmed'
                        ? 'primary'
                        : session.status === 'completed'
                          ? 'muted'
                          : 'tertiary'
                    }
                  >
                    {session.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(session.status === 'booked' || session.status === 'confirmed') && (
                  <CancelSessionButton sessionId={session.id} />
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
        ))}
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
