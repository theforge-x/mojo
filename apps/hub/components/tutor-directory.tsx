import {
  type AvailabilityRule,
  type SchedulingSettings,
  tutorLocalTime,
} from '@mojo/scheduling/domain';
import { Card, CardContent, Empty, EmptyDescription, EmptyTitle } from '@mojo/shared/ui';
import { SearchX } from 'lucide-react';
import { getHub } from '../demo/composition-root';
import { currentUser } from '../lib/session';
import { type EnrichedTutor, TutorListCard, TutorMasonryCard } from './tutor-cards';
import { type TutorDirectoryView, TutorFilterBar } from './tutor-filter-bar';

export type TutorDirectorySearchParams = {
  subject?: string;
  level?: string;
  language?: string;
  minRating?: string;
  availableWithinHours?: string;
  view?: string;
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

  const { subject, level, language, minRating, availableWithinHours, view } = searchParams;
  const parsedRating = toRating(minRating);
  const parsedHours = Number(availableWithinHours);
  const hasFilters = Boolean(subject || level || language || minRating || parsedHours > 0);
  const activeView: TutorDirectoryView = view === 'grid' ? 'grid' : 'list';

  const [tutors, subjectGroups] = await Promise.all([
    hub.discovery.search({
      ...(subject ? { subject } : {}),
      ...(isValidLevel(level) ? { level: level as 'entry' | 'established' | 'expert' } : {}),
      ...(language ? { language } : {}),
      ...(parsedRating !== undefined ? { minRating: parsedRating } : {}),
      ...(isValidHorizon(parsedHours) ? { availableWithinHours: parsedHours } : {}),
    }),
    hub.catalog.options(),
  ]);

  if (user?.role === 'student' && hasFilters) {
    for (const tutor of tutors) {
      hub.interests
        .record({ studentId: user.id, tutorId: tutor.tutorId, source: 'search' })
        .catch(() => {});
    }
  }

  const enriched: EnrichedTutor[] = await Promise.all(
    tutors.map(async (tutor) => {
      const [profile, performance, reviews, settings, rules] = await Promise.all([
        hub.profile.byTutor(tutor.tutorId),
        hub.performance.byTutor(tutor.tutorId),
        hub.reviews.forTutor(tutor.tutorId),
        hub.scheduling.settings(tutor.tutorId),
        hub.scheduling.availabilityRules(tutor.tutorId),
      ]);
      return {
        tutorId: tutor.tutorId,
        displayName: tutor.displayName,
        photoUrl: tutor.photoUrl,
        education: tutor.education,
        timezone: tutor.timezone,
        level: tutor.level,
        perSegmentMinor: tutor.perSegmentMinor,
        rating: tutor.rating,
        responseTimeMinutesAvg: tutor.responseTimeMinutesAvg,
        subjects: profile?.subjects ?? [],
        languages: profile?.languages ?? [],
        bio: profile?.bio ?? '',
        lessonsTaught: Math.max(0, Math.round(performance?.cumulativeHoursTaught ?? 0)),
        reviewCount: reviews.length,
        isAvailableNow: await isAvailableNow(
          hub,
          tutor.tutorId,
          settings,
          rules,
          new Date().toISOString(),
        ),
      };
    }),
  );

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        {enriched.length} tutor{enriched.length === 1 ? '' : 's'} available. Pick one and book a
        slot.
      </p>
      <TutorFilterBar
        subject={subject ?? ''}
        level={level ?? ''}
        language={language ?? ''}
        minRating={minRating ?? ''}
        availableWithinHours={availableWithinHours ?? ''}
        view={activeView}
        subjectGroups={subjectGroups}
      />
      {enriched.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <SearchX className="size-8 text-muted-foreground" aria-hidden />
              <EmptyTitle>No tutors match those filters</EmptyTitle>
              <EmptyDescription>
                Try a different subject, language, or availability window.
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : activeView === 'grid' ? (
        <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
          {enriched.map((tutor, index) => (
            <TutorMasonryCard key={tutor.tutorId} tutor={tutor} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {enriched.map((tutor) => (
            <TutorListCard key={tutor.tutorId} tutor={tutor} />
          ))}
        </div>
      )}
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

/**
 * Honest "available now": the tutor's recurring weekly rules cover the current
 * minute in their own timezone, bookings aren't paused, and no `blocked`
 * exception covers right now (an `extra` window also counts). There is no
 * real-time presence tracking in the app, so the badge only renders when this
 * returns true instead of claiming every tutor is online.
 */
async function isAvailableNow(
  hub: ReturnType<typeof getHub>,
  tutorId: string,
  settings: SchedulingSettings,
  rules: readonly AvailabilityRule[],
  nowIso: string,
): Promise<boolean> {
  if (settings.pausedForNewBookings) return false;
  const now = tutorLocalTime(nowIso, settings.timezone);
  if (now.weekday < 0) return false;
  const exceptions = await hub.scheduling.exceptions(tutorId, now.dateKey, now.dateKey);
  const coversNow = (startMinute: number, endMinute: number) =>
    now.minutes >= startMinute && now.minutes < endMinute;
  if (
    exceptions.some(
      (exception) =>
        exception.kind === 'blocked' &&
        exception.date === now.dateKey &&
        coversNow(exception.startMinute, exception.endMinute),
    )
  ) {
    return false;
  }
  if (
    rules.some(
      (rule) => rule.weekday === now.weekday && coversNow(rule.startMinute, rule.endMinute),
    )
  ) {
    return true;
  }
  return exceptions.some(
    (exception) =>
      exception.kind === 'extra' &&
      exception.date === now.dateKey &&
      now.minutes >= exception.startMinute &&
      now.minutes < exception.endMinute,
  );
}
