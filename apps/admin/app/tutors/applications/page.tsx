import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import type { TutorApplication } from '@mojo/tutor-profile/domain';

async function getPendingApplications(): Promise<TutorApplication[]> {
  return [
    {
      id: 'app_1', tutorId: 't_9', subjects: ['Spanish'], bio: '', introVideoUrl: '',
      certifications: [], status: 'pending', submittedAt: '2026-08-28T02:00:00.000Z',
    },
  ];
}

export default async function ApplicationQueuePage() {
  const applications = await getPendingApplications();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-headline">Application queue</h1>
      <div className="flex flex-col gap-3">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <CardTitle>{app.subjects.join(', ')}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant="tertiary">{app.status}</Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Reject
                </Button>
                <Button size="sm">Approve</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
