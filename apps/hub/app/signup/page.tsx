import { SiteLogo } from '@mojo/shared/ui';
import { redirect } from 'next/navigation';
import { SignupForm } from '../../components/signup-form';
import { currentUser } from '../../lib/session';

export default async function SignupPage() {
  const user = await currentUser();
  if (user) redirect(user.role === 'tutor' ? '/tutor' : '/');

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <SiteLogo />
        <div className="rounded-lg border border-border bg-background p-6">
          <h1 className="mb-1 font-display text-xl font-bold text-headline">Create your account</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Join mojo as a student — book live lessons with vetted tutors in minutes.
          </p>
          <SignupForm />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Want to teach instead?{' '}
          <a href="/apply" className="font-medium text-primary hover:underline">
            Become a tutor
          </a>
        </p>
      </div>
    </main>
  );
}
