import { Badge, Card, CardContent } from '@mojo/shared/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHub } from '../../../demo/composition-root';
import { formatMinor } from '../../../lib/format';
import { currentUser } from '../../../lib/session';

const LEVEL_BADGE: Record<string, 'muted' | 'primary' | 'tertiary'> = {
  entry: 'muted',
  established: 'primary',
  expert: 'tertiary',
};

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; level?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'student') redirect('/tutor');

  const { subject, level } = await searchParams;
  const tutors = await getHub().discovery.search({
    ...(subject ? { subject } : {}),
    ...(isValidLevel(level) ? { level: level as 'entry' | 'established' | 'expert' } : {}),
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 font-display text-2xl font-bold text-headline">Find your tutor</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {tutors.length} tutor{tutors.length === 1 ? '' : 's'} available. Pick one and book a slot.
      </p>
      <div className="flex flex-col gap-3">
        {tutors.map((tutor) => (
          <Link
            key={tutor.tutorId}
            href={`/tutors/${tutor.tutorId}`}
            className="transition-opacity hover:opacity-90"
          >
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="font-display text-base font-bold text-headline">
                    {tutor.displayName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatMinor(tutor.perSegmentMinor)}/segment · responds in ~
                    {tutor.responseTimeMinutesAvg} min
                    {tutor.rating > 0 && <> · {tutor.rating.toFixed(1)}★</>}
                  </div>
                </div>
                <Badge variant={LEVEL_BADGE[tutor.level]}>{tutor.level}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

function isValidLevel(level: string | undefined): level is 'entry' | 'established' | 'expert' {
  return level === 'entry' || level === 'established' || level === 'expert';
}
