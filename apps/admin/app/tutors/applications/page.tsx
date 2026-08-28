import { Badge, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import { getAdmin } from '../../../demo/composition-root';
import { ReviewButtons } from '../../../components/review-buttons';

export default async function ApplicationQueuePage() {
  const admin = getAdmin();
  const applications = admin.applications.list();
  const names = await Promise.all(
    applications.map(async (app) => ({
      id: app.id,
      displayName: (await admin.profiles.byTutor(app.tutorId))?.displayName ?? `applicant ${app.tutorId}`,
    })),
  );
  const displayNameFor = new Map(names.map((n) => [n.id, n.displayName]));

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-headline">Application queue</h1>
      {applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <CardTitle>
                  {app.subjects.join(', ')} — {displayNameFor.get(app.id)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="max-w-prose">
                  <p className="text-sm text-muted-foreground">{app.bio}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
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
          ))}
        </div>
      )}
    </main>
  );
}