import { Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import Link from 'next/link';
import { ApplyForm } from '../../components/apply-form';
import { getHub } from '../../demo/composition-root';
import { currentUser } from '../../lib/session';

export default async function ApplyPage() {
  const user = await currentUser();

  if (user) {
    const hub = getHub();
    const application = await hub.profile.applicationForTutor(user.id);
    if (application) {
      return (
        <main className="mx-auto max-w-2xl p-6">
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <p>
                {application.status === 'approved' && 'You are already a tutor.'}
                {application.status === 'in_review' &&
                  'Your application is being reviewed. Hang tight!'}
                {application.status === 'pending' && 'Your application is in the queue for review.'}
                {application.status === 'rejected' &&
                  'Your application was not approved — edit and resubmit anytime.'}
              </p>
              {application.status === 'approved' ? (
                <Link href="/tutor">
                  <Button size="sm">Go to your hub</Button>
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Status: <span className="font-medium">{application.status}</span> · submitted{' '}
                  {new Date(application.submittedAt).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      );
    }
    const profile = await hub.profile.byTutor(user.id);
    if (profile) {
      return (
        <main className="mx-auto max-w-2xl p-6">
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <p>You are already a tutor.</p>
              <Link href="/tutor">
                <Button size="sm">Go to your hub</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-6 lg:p-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-headline">Become a mojo tutor</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          A 5-minute onboarding — pick your subjects, tell students what makes your lessons click,
          and you&apos;re through to tutor review. No account needed to start.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Application</CardTitle>
        </CardHeader>
        <CardContent>
          <ApplyForm signedIn={Boolean(user)} name={user?.name ?? ''} email={user?.email ?? ''} />
        </CardContent>
      </Card>
    </main>
  );
}
