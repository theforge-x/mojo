import { AvailabilityEditorClient } from '../../../components/availability-editor-client';
import { getHub } from '../../../demo/composition-root';
import { currentUser } from '../../../lib/session';

export default async function AvailabilityPage() {
  const user = await currentUser();
  if (!user || user.role !== 'tutor') return null;

  const hub = getHub();
  const [rules, settings] = await Promise.all([
    hub.scheduling.availabilityRules(user.id),
    hub.scheduling.settings(user.id),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 font-display text-2xl font-bold text-headline">Availability</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Books must be at least {settings.minimumNoticeMinutes} minutes ahead, and get a{' '}
        {settings.bufferMinutes}-minute buffer on either side.
      </p>
      <AvailabilityEditorClient initialRules={rules} />
    </main>
  );
}
