import { redirect } from 'next/navigation';
import { LandingPage } from '../components/landing-page';
import { TutorDirectory } from '../components/tutor-directory';
import { getHub } from '../demo/composition-root';
import { currentUser } from '../lib/session';
import { StudentHome } from './(student)/student-home';

/**
 * Root hand-off: landing for guests, the student home (also `/`) when signed in.
 * A student starts at the filterable tutor list until they complete their first
 * lesson — only then does the overview become the default view.
 */
export default async function HomePage() {
  const user = await currentUser();
  if (!user) return <LandingPage />;
  if (user.role === 'tutor') redirect('/tutor');
  if (user.role !== 'student') redirect('/login');

  const hub = getHub();
  const sessions = await hub.scheduling.sessionsByStudent(user.id);
  const hasCompletedLesson = sessions.some((session) => session.status === 'completed');
  if (hasCompletedLesson) return <StudentHome />;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 font-display text-2xl font-bold text-headline">
        Hi {user.name.split(' ')[0] || user.email.split('@')[0]}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Pick a tutor, ask a question, and book your first lesson.
      </p>
      <TutorDirectory searchParams={{}} />
    </main>
  );
}
