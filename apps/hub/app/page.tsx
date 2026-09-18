import { redirect } from 'next/navigation';
import { LandingPage } from '../components/landing-page';
import { parseSessionView } from '../components/session-cards';
import { TutorDirectory } from '../components/tutor-directory';
import { getHub } from '../demo/composition-root';
import { getLandingData } from '../lib/landing-data';
import { currentUser } from '../lib/session';
import { StudentHome } from './(student)/student-home';

/**
 * Root hand-off: landing for guests, the student home (also `/`) when signed in.
 * A student starts at the filterable tutor list until they complete their first
 * lesson — only then does the overview become the default view.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; subject?: string }>;
}) {
  const user = await currentUser();
  if (!user) return <LandingPage data={await getLandingData()} />;
  if (user.role === 'tutor') redirect('/tutor');
  if (user.role !== 'student') redirect('/login');

  const hub = getHub();
  const sessions = await hub.scheduling.sessionsByStudent(user.id);
  const hasCompletedLesson = sessions.some((session) => session.status === 'completed');
  if (hasCompletedLesson) {
    const params = await searchParams;
    return <StudentHome view={parseSessionView(params.view)} />;
  }

  const store = await searchParams;
  // Subject intent carried from the landing search through signup.
  const subjectIntent = (store.subject ?? '').trim().slice(0, 40) || undefined;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 font-display text-2xl font-bold text-headline">
        Hi {user.name.split(' ')[0] || user.email.split('@')[0]}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {subjectIntent
          ? `Tutors for ${subjectIntent} — pick one and book your first lesson.`
          : 'Pick a tutor, ask a question, and book your first lesson.'}
      </p>
      <TutorDirectory searchParams={subjectIntent ? { subject: subjectIntent } : {}} />
    </main>
  );
}
