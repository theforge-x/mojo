import { redirect } from 'next/navigation';
import { SavedTutorsList } from '../../components/saved-tutors-list';
import { currentUser } from '../../lib/session';

export default async function SavedTutorsPage() {
  const user = await currentUser();
  const home = user?.role === 'tutor' ? '/tutor' : '/';
  if (user?.role !== 'student') redirect(home);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-headline">Saved tutors</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your shortlist, ready when you are.</p>
      <SavedTutorsList />
    </main>
  );
}
