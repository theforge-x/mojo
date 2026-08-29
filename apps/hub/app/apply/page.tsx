import { Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import Link from 'next/link';
import { ApplyForm } from '../../components/apply-form';
import { getHub } from '../../demo/composition-root';
import { currentUser } from '../../lib/session';

export default async function ApplyPage() {
  const user = await currentUser();
  if (user?.role === 'tutor') {
    const profile = user.role === 'tutor' ? await getHub().profile.byTutor(user.id) : null;
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
    <main className="mx-auto max-w-2xl p-10">
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
