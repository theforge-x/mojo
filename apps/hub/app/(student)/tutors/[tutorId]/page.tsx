import { tutorLocalTime } from '@mojo/scheduling/domain';
import { Badge, Button, Card, CardContent, Empty, EmptyDescription } from '@mojo/shared/ui';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookButton } from '../../../../components/book-button';
import { SaveTutorButton } from '../../../../components/save-tutor-button';
import { getHub } from '../../../../demo/composition-root';
import { formatMinor, formatWhen } from '../../../../lib/format';
import { currentUser } from '../../../../lib/session';
import { bookableSlots } from '../../../../lib/slots';

export default async function TutorDetailPage({
  params,
}: {
  params: Promise<{ tutorId: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'student') redirect('/tutor');

  const { tutorId } = await params;
  const hub = getHub();
  const settings = await hub.scheduling.settings(tutorId);
  const todayKey = tutorLocalTime(new Date().toISOString(), settings.timezone).dateKey;
  const weekEndKey = dateKeyPlus(todayKey, 7);

  const [tutors, rules, sessions, exceptions, profile] = await Promise.all([
    hub.discovery.search({}),
    hub.scheduling.availabilityRules(tutorId),
    hub.scheduling.sessionsByTutor(tutorId),
    hub.scheduling.exceptions(tutorId, todayKey, weekEndKey),
    hub.profile.byTutor(tutorId),
  ]);
  const tutor = tutors.find((t) => t.tutorId === tutorId);
  if (!tutor) notFound();

  const slots = bookableSlots(rules, settings, {
    exceptions,
    existingSessions: sessions,
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-headline">{tutor.displayName}</h1>
          <SaveTutorButton
            tutor={{
              tutorId,
              displayName: tutor.displayName,
              subjects: profile?.subjects ?? [],
              perSegmentMinor: tutor.perSegmentMinor,
              level: tutor.level,
            }}
          />
        </div>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="primary">{tutor.level}</Badge>
          <span>{formatMinor(tutor.perSegmentMinor)}/segment</span>
          {tutor.rating > 0 && <span>{tutor.rating.toFixed(1)}★</span>}
        </div>
        {profile?.bio && (
          <p className="mt-3 max-w-prose text-sm text-muted-foreground">{profile.bio}</p>
        )}
      </div>

      <h2 className="mb-3 font-display text-lg font-bold text-headline">Available slots</h2>
      {settings.pausedForNewBookings ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyDescription>
                This tutor is not accepting new bookings right now.
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : slots.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyDescription>This tutor has no open slots in the coming week.</EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {slots.slice(0, 24).map((slot) => (
            <Card key={slot.startIso}>
              <CardContent className="flex items-center justify-between py-4">
                <span className="text-sm">{formatWhen(slot.startIso, slot.endIso)}</span>
                <BookButton
                  tutorId={tutorId}
                  studentId={user.id}
                  startIso={slot.startIso}
                  endIso={slot.endIso}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Slots shown respect this tutor&apos;s weekly availability and minimum-notice window. Booking
        is verified again by the scheduling domain before it&apos;s confirmed.
      </p>
      <Link href="/tutors" className="mt-2 inline-block">
        <Button variant="outline" size="sm">
          Back to tutors
        </Button>
      </Link>
    </main>
  );
}

function dateKeyPlus(key: string, offset: number): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
