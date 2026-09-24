import { tutorLocalTime } from '@mojo/scheduling/domain';
import { AvailabilityEditorClient } from '../../../components/availability-editor-client';
import { ExceptionEditorClient } from '../../../components/exception-editor-client';
import { SchedulingSettingsClient } from '../../../components/scheduling-settings-client';
import { getHub } from '../../../demo/composition-root';
import { currentUser } from '../../../lib/session';

export default async function AvailabilityPage() {
  const user = await currentUser();
  if (user?.role !== 'tutor') return null;

  const hub = getHub();
  const settings = await hub.scheduling.settings(user.id);
  const todayKey = tutorLocalTime(new Date().toISOString(), settings.timezone).dateKey;
  const [rules, exceptions, sessions] = await Promise.all([
    hub.scheduling.availabilityRules(user.id),
    hub.scheduling.exceptions(user.id, todayKey, dateKeyPlus(todayKey, 14)),
    hub.scheduling.sessionsByTutor(user.id),
  ]);

  const thisWeek = sessions.filter((s) => s.startIso >= new Date().toISOString()).slice(0, 20);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 font-display text-2xl font-bold text-headline">Availability</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Books must be at least {settings.minimumNoticeMinutes} minutes ahead, and get a{' '}
        {settings.bufferMinutes}-minute buffer on either side.
      </p>
      <div className="mb-4">
        <AvailabilityEditorClient initialRules={rules} />
      </div>
      <div className="mb-4">
        <ExceptionEditorClient initialExceptions={exceptions} todayKey={todayKey} />
      </div>
      <SchedulingSettingsClient initialSettings={settings} sessions={thisWeek} />
    </main>
  );
}

function dateKeyPlus(key: string, offset: number): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
