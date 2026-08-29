import { Badge, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import Link from 'next/link';
import { FlagToggle } from '../../components/flag-toggle';
import { getAdmin } from '../../demo/composition-root';
import { formatMinor } from '../../lib/format';

export default async function AdminNexus() {
  const admin = getAdmin();
  const [metrics, leaderboard, flags, disputes, reviews, log] = await Promise.all([
    admin.analytics.metrics(),
    admin.analytics.leaderboard(5),
    admin.config.flags(),
    admin.disputes.list(),
    admin.reviews.list(),
    admin.log.list(),
  ]);

  const openDisputes = disputes.filter((d) => d.status === 'open');
  const flaggedReviews = reviews.filter((r) => r.flagged);
  const pendingApplications = admin.applications.list().filter((a) => a.status === 'pending');

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-headline">Morning rundown</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>GMV</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-display text-2xl font-extrabold text-headline">
              {formatMinor(metrics.gmvMinor)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active tutors</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-extrabold text-headline">
              {metrics.activeTutors}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active students</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-extrabold text-headline">
              {metrics.activeStudents}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending applications</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-display text-3xl font-extrabold text-headline">
              {pendingApplications.length}
            </span>
            <Link href="/tutors/applications">
              <Badge variant="tertiary">review</Badge>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {leaderboard.map((entry) => (
              <div key={entry.tutorId} className="flex items-center justify-between text-sm">
                <span>
                  <span className="font-mono text-muted-foreground">#{entry.rank}</span>{' '}
                  {entry.displayName}
                </span>
                <span className="text-muted-foreground">
                  {(entry.cancellationRate * 100).toFixed(0)}% cancelled
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature flags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {flags.map((flag) => (
              <div key={flag.key} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-mono">{flag.key}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{flag.rolloutPercent}%</span>
                </div>
                <FlagToggle flag={flag} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Link href="/trust/disputes">
          <Card>
            <CardHeader>
              <CardTitle>Open disputes</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="font-display text-3xl font-extrabold text-headline">
                {openDisputes.length}
              </span>
              <Badge variant="destructive">{flaggedReviews.length} flagged review</Badge>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Latest audit log</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
            {log.slice(0, 4).map((entry) => (
              <span key={entry.id}>
                {entry.action} · {entry.targetId}
              </span>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
