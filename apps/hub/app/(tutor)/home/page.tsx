import { Badge, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import { CalendarView } from '@mojo/scheduling/feature';
import type { ScheduledSession } from '@mojo/scheduling/domain';

// Server Component — fetches through the application-layer use-cases at the
// composition root, not shown here at scaffold depth (see the "authentic,
// not runnable" note in the code-generation summary).
async function getTodaysSessions(): Promise<ScheduledSession[]> {
  return [
    {
      id: 's_1', tutorId: 't_1', studentId: 'st_1',
      startIso: '2026-08-28T10:00:00.000Z', endIso: '2026-08-28T10:30:00.000Z',
      status: 'confirmed', isTrial: false, statusHistory: [],
    },
    {
      id: 's_2', tutorId: 't_1', studentId: 'st_2',
      startIso: '2026-08-28T13:30:00.000Z', endIso: '2026-08-28T14:00:00.000Z',
      status: 'booked', isTrial: true, statusHistory: [],
    },
  ];
}

export default async function TutorDashboardPage() {
  const sessions = await getTodaysSessions();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-headline">Good morning, Kelechi</h1>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-extrabold text-headline">{sessions.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="tertiary">Established</Badge>
          </CardContent>
        </Card>
      </div>
      <CalendarView sessions={sessions} />
    </main>
  );
}
