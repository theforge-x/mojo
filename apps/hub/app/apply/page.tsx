import { Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import { currentUser } from '../../lib/session';
import { ApplyForm } from '../../components/apply-form';

export default async function ApplyPage() {
  const user = await currentUser();
  if (user?.role === 'tutor') {
    return (
      <main className="mx-auto max-w-lg p-6">
        <Card>
          <CardContent>You are already a tutor.</CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-2 font-display text-2xl font-bold text-headline">Become a tutor</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Apply to teach on mojo. Your application goes to tutor review, and you&apos;ll appear in search once approved.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Application</CardTitle>
        </CardHeader>
        <CardContent>
          <ApplyForm />
        </CardContent>
      </Card>
    </main>
  );
}