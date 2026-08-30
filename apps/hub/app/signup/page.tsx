import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '../../components/auth-shell';
import { SignupForm } from '../../components/signup-form';
import { currentUser } from '../../lib/session';

export default async function SignupPage() {
  const user = await currentUser();
  if (user) redirect(user.role === 'tutor' ? '/tutor' : '/');

  return (
    <AuthShell>
      <div className="rounded-lg border border-border bg-background p-6">
        <h1 className="mb-1 font-display text-xl font-bold text-headline">Create your account</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Join mojo as a student — book live lessons with vetted tutors in minutes.
        </p>
        <SignupForm />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Want to teach instead?{' '}
        <Link href="/apply" className="font-medium text-primary hover:underline">
          Become a tutor
        </Link>
      </p>
    </AuthShell>
  );
}
