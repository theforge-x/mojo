import { redirect } from 'next/navigation';
import {
  TutorDirectory,
  type TutorDirectorySearchParams,
} from '../../../components/tutor-directory';
import { currentUser } from '../../../lib/session';

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<TutorDirectorySearchParams>;
}) {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'student') redirect('/tutor');

  const params = await searchParams;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 font-display text-2xl font-bold text-headline">Find your tutor</h1>
      <TutorDirectory searchParams={params} />
    </main>
  );
}
