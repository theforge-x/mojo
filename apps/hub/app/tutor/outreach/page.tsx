import { isMojoPlusActive } from '@mojo/mojo-plus/domain';
import { TutorOutreach } from '@mojo/mojo-plus/feature';
import { redirect } from 'next/navigation';
import { getHub } from '../../../demo/composition-root';
import { currentUser } from '../../../lib/session';

export default async function TutorOutreachPage() {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'tutor') redirect('/');

  const hub = getHub();
  const subscription = await hub.plus.subscription(user.id);
  const hasAccess = isMojoPlusActive(subscription);

  // Interest is recorded for every tutor so leads accumulate while
  // unsubscribed — but names and message CTAs are a Mojo+ benefit, so only
  // subscribers read the rows; everyone else sees the locked teaser count.
  const [leadRows, sessions] = await Promise.all([
    hasAccess ? hub.plus.outreachLeads(user.id) : hub.interests.forTutor(user.id),
    hub.scheduling.sessionsByTutor(user.id),
  ]);

  const sessionStudents = new Set(sessions.map((s) => s.studentId));
  const rows = hasAccess
    ? await Promise.all(
        leadRows.map(async (interest) => {
          const student = interest.studentId
            ? await hub.identity.userById(interest.studentId)
            : null;
          return {
            studentId: interest.studentId,
            displayName: student?.name || student?.email || interest.studentId,
            source: interest.source,
            createdAt: interest.createdAt,
            alreadyBooked: sessionStudents.has(interest.studentId),
          };
        }),
      )
    : [];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <TutorOutreach hasAccess={hasAccess} leads={rows} totalCount={leadRows.length} />
    </main>
  );
}
