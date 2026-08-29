import { redirect } from 'next/navigation';
import { LandingPage } from '../components/landing-page';
import { currentUser } from '../lib/session';
import { StudentHome } from './(student)/student-home';

/** Root hand-off: landing for guests, the student home (also `/`) when signed in. */
export default async function HomePage() {
  const user = await currentUser();
  if (!user) return <LandingPage />;
  if (user.role === 'tutor') redirect('/tutor');
  if (user.role !== 'student') redirect('/login');
  return <StudentHome />;
}
