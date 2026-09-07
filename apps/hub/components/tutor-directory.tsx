import { Avatar, Card, CardContent } from '@mojo/shared/ui';
import Link from 'next/link';
import { getHub } from '../demo/composition-root';
import { formatMinor } from '../lib/format';
import { currentUser } from '../lib/session';
import { LevelBadge } from './level-badge';
import { TutorFilterBar } from './tutor-filter-bar';

export type TutorDirectorySearchParams = {
  subject?: string;
  level?: string;
  language?: string;
  minRating?: string;
  availableWithinHours?: string;
};

/**
 * Filterable tutor list, shared by `/tutors` and the student home page.
 * A student running a real search (any filter) signals interest in the
 * results so those tutors can reach out to them.
 */
export async function TutorDirectory({
  searchParams,
}: {
  searchParams: TutorDirectorySearchParams;
}) {
  const user = await currentUser();
  const hub = getHub();

  const { subject, level, language, minRating, availableWithinHours } = searchParams;
  const parsedRating = toRating(minRating);
  const parsedHours = Number(availableWithinHours);
  const hasFilters = Boolean(subject || level || language || minRating || parsedHours > 0);

  const tutors = await hub.discovery.search({
    ...(subject ? { subject } : {}),
    ...(isValidLevel(level) ? { level: level as 'entry' | 'established' | 'expert' } : {}),
    ...(language ? { language } : {}),
    ...(parsedRating !== undefined ? { minRating: parsedRating } : {}),
    ...(isValidHorizon(parsedHours) ? { availableWithinHours: parsedHours } : {}),
  });

  if (user?.role === 'student' && hasFilters) {
    for (const tutor of tutors) {
      hub.interests
        .record({ studentId: user.id, tutorId: tutor.tutorId, source: 'search' })
        .catch(() => {});
    }
  }

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        {tutors.length} tutor{tutors.length === 1 ? '' : 's'} available. Pick one and book a slot.
      </p>
      <TutorFilterBar
        subject={subject ?? ''}
        level={level ?? ''}
        language={language ?? ''}
        minRating={minRating ?? ''}
        availableWithinHours={availableWithinHours ?? ''}
      />
      <div className="flex flex-col gap-3">
        {tutors.map((tutor) => (
          <Link
            key={tutor.tutorId}
            href={`/tutors/${tutor.tutorId}`}
            className="transition-opacity hover:opacity-90"
          >
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={tutor.displayName} src={tutor.photoUrl || undefined} />
                  <div>
                    <div className="font-display text-base font-bold text-headline">
                      {tutor.displayName}
                    </div>
                    {tutor.education && (
                      <div className="text-xs text-muted-foreground">{tutor.education}</div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {formatMinor(tutor.perSegmentMinor)}/segment · responds in ~
                      {tutor.responseTimeMinutesAvg} min
                      {tutor.rating > 0 && <> · {tutor.rating.toFixed(1)}★</>}
                    </div>
                  </div>
                </div>
                <LevelBadge level={tutor.level} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

function isValidLevel(level: string | undefined): level is 'entry' | 'established' | 'expert' {
  return level === 'entry' || level === 'established' || level === 'expert';
}

function toRating(value: string | undefined): number | undefined {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) return undefined;
  return rating;
}

function isValidHorizon(hours: number): hours is number {
  return Number.isInteger(hours) && hours >= 1 && hours <= 168;
}
