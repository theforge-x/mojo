import { redirect } from 'next/navigation';
import { SettingsForm } from '../../components/settings-form';
import { currentUser } from '../../lib/session';

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'tutor' && user.role !== 'student') redirect('/tutor');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-headline">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">Account and notification preferences.</p>
      <SettingsForm user={{ name: user.name, email: user.email, role: user.role }} />
    </main>
  );
}
