import { LoginForm } from '@mojo/identity/feature';
import { SiteLogo } from '@mojo/shared/ui';
import { getHub } from '../../demo/composition-root';
import { loginWithDemo } from '../../lib/actions';

export default function LoginPage() {
  const { demoAccounts } = getHub();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <SiteLogo />
        <div className="rounded-lg border border-border bg-background p-6">
          <h1 className="mb-4 font-display text-xl font-bold text-headline">Sign in to mojo</h1>
          <LoginForm onSubmit={loginWithDemo} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Demo accounts — password <code>Password123</code>:
          {demoAccounts.map((account) => (
            <span key={account.id} className="ml-1 inline-block">
              <code className="rounded bg-muted px-1">{account.email}</code>
            </span>
          ))}
        </p>
      </div>
    </main>
  );
}