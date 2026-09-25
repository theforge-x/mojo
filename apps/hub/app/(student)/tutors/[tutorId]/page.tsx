import { TRIAL_PRICE_PERCENT } from '@mojo/payments/domain';
import { tutorLocalTime } from '@mojo/scheduling/domain';
import { Badge, Button, Card, CardContent, Empty, EmptyDescription } from '@mojo/shared/ui';
import { segmentsBetween } from '@mojo/shared/util';
import { CalendarDays, Play, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookButton } from '../../../../components/book-button';
import { JoinLabButton } from '../../../../components/join-lab-button';
import { SaveTutorButton } from '../../../../components/save-tutor-button';
import {
  durationMinutes,
  parseSessionView,
  SessionGridCard,
  SessionListCard,
} from '../../../../components/session-cards';
import { SessionViewToggle } from '../../../../components/session-view-toggle';
import { getHub } from '../../../../demo/composition-root';
import { formatMinor } from '../../../../lib/format';
import { currentUser } from '../../../../lib/session';
import { bookableSlots } from '../../../../lib/slots';

export default async function TutorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tutorId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'student') redirect('/tutor');

  const [{ tutorId }, query] = await Promise.all([params, searchParams]);
  const view = parseSessionView(query.view);
  const hub = getHub();
  const settings = await hub.scheduling.settings(tutorId);
  const todayKey = tutorLocalTime(new Date().toISOString(), settings.timezone).dateKey;
  const weekEndKey = dateKeyPlus(todayKey, 7);

  const [tutors, rules, sessions, exceptions, profile, tutorReviews, myCharges, myGrants] =
    await Promise.all([
      hub.discovery.search({}),
      hub.scheduling.availabilityRules(tutorId),
      hub.scheduling.sessionsByTutor(tutorId),
      hub.scheduling.exceptions(tutorId, todayKey, weekEndKey),
      hub.profile.byTutor(tutorId),
      hub.reviews.forTutor(tutorId),
      hub.billing.chargesByStudent(user.id),
      hub.billing.grants(user.id),
    ]);
  const tutor = tutors.find((t) => t.tutorId === tutorId);
  if (!tutor) notFound();
  const trialUsed = myCharges.some(
    (charge) => charge.tutorId === tutorId && charge.isTrial && charge.status !== 'refunded',
  );
  const replacementGrant = myGrants.find(
    (grant) => grant.tutorId === tutorId && grant.status === 'granted',
  );

  hub.interests.record({ studentId: user.id, tutorId, source: 'view' }).catch(() => {});

  const slots = bookableSlots(rules, settings, {
    exceptions,
    existingSessions: sessions,
  });

  const openLabs = await hub.groups.openLabs(tutorId);
  const labCards = await Promise.all(
    openLabs.map(async (lab) => {
      const members = await hub.groups.members(lab.id);
      const active = members.filter((m) => m.status !== 'cancelled' && m.status !== 'no_show');
      const quote = await hub.billing
        .quote({
          tutorId,
          startIso: lab.startIso,
          endIso: lab.endIso,
          isTrial: false,
          groupSize: active.length > 1 ? active.length : undefined,
        })
        .catch(() => null);
      return {
        lab,
        seatsTaken: active.length,
        perStudentMinor: quote?.totalMinor ?? null,
        joinedSessionId: active.find((m) => m.studentId === user.id)?.id ?? null,
      };
    }),
  );

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-headline">{tutor.displayName}</h1>
          <div className="flex items-center gap-2">
            <Link href={`/messages?with=${encodeURIComponent(tutorId)}`}>
              <Button variant="outline" size="sm">
                Message tutor
              </Button>
            </Link>
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
        </div>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="primary">{tutor.level}</Badge>
          <span>{formatMinor(tutor.perSegmentMinor)}/segment</span>
          {tutor.rating > 0 && <span>{tutor.rating.toFixed(1)}★</span>}
        </div>
        {!trialUsed && (
          <p className="mt-1 text-xs text-muted-foreground">
            First lesson trial — {100 - TRIAL_PRICE_PERCENT}% off any slot below.
          </p>
        )}
        {replacementGrant && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-headline">
            <Sparkles className="size-3.5" aria-hidden />
            Free replacement lesson banked — tick the box at checkout to use it.
          </p>
        )}
        {profile?.bio && (
          <p className="mt-3 max-w-prose text-sm text-muted-foreground">{profile.bio}</p>
        )}
        {profile && profile.languages.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Teaches in: {profile.languages.join(', ')}
          </p>
        )}
        {profile?.introVideoUrl && (
          <a
            href={profile.introVideoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/80 py-1 pl-1 pr-4 text-sm font-medium text-white transition-opacity hover:opacity-85"
          >
            <span className="grid size-8 place-items-center rounded-full bg-white/20">
              <Play className="size-4 fill-white" aria-hidden />
            </span>
            Watch {tutor.displayName.split(' ')[0]}&apos;s intro
          </a>
        )}
      </div>

      {labCards.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-headline">
              <Users className="size-5 text-primary" aria-hidden />
              Group labs
              <span className="text-sm font-medium text-muted-foreground">({labCards.length})</span>
            </h2>
          </div>
          <div className="mb-6 flex flex-col gap-4">
            {labCards.map(({ lab, seatsTaken, perStudentMinor, joinedSessionId }) => (
              <SessionListCard
                key={lab.id}
                startIso={lab.startIso}
                endIso={lab.endIso}
                tone="teal"
                title={lab.title}
                subtitle={
                  perStudentMinor !== null
                    ? `${formatMinor(perStudentMinor)} per seat · price drops as seats fill`
                    : 'Group lab'
                }
                badges={
                  <Badge variant="secondary" className="gap-1">
                    <Users className="size-3" aria-hidden />
                    Group · {seatsTaken}/{lab.maxSeats}
                  </Badge>
                }
                actions={
                  <JoinLabButton
                    labId={lab.id}
                    perStudentMinor={perStudentMinor}
                    seatsTaken={seatsTaken}
                    seatsTotal={lab.maxSeats}
                    joinedSessionId={joinedSessionId}
                    priceLabel={(minor) => formatMinor(minor)}
                  />
                }
              />
            ))}
          </div>
        </>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-headline">
          <CalendarDays className="size-5 text-primary" aria-hidden />
          Available slots
          <span className="text-sm font-medium text-muted-foreground">
            ({Math.min(slots.length, 24)})
          </span>
        </h2>
        {slots.length > 0 && <SessionViewToggle view={view} />}
      </div>
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
      ) : view === 'grid' ? (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          {slots.slice(0, 24).map((slot) => (
            <SessionGridCard
              key={slot.startIso}
              startIso={slot.startIso}
              endIso={slot.endIso}
              tone="teal"
              title={`${durationMinutes(slot.startIso, slot.endIso)} min lesson`}
              subtitle={slotSubtitle(slot.startIso, slot.endIso, tutor.perSegmentMinor)}
              badges={
                !trialUsed && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="size-3" aria-hidden />
                    Trial −{100 - TRIAL_PRICE_PERCENT}%
                  </Badge>
                )
              }
              actions={
                <BookButton
                  tutorId={tutorId}
                  studentId={user.id}
                  startIso={slot.startIso}
                  endIso={slot.endIso}
                  perSegmentMinor={tutor.perSegmentMinor}
                  trialUsed={trialUsed}
                  replacementGrantId={replacementGrant?.id}
                />
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {slots.slice(0, 24).map((slot) => (
            <SessionListCard
              key={slot.startIso}
              startIso={slot.startIso}
              endIso={slot.endIso}
              tone="teal"
              title={`${durationMinutes(slot.startIso, slot.endIso)} min lesson`}
              subtitle={slotSubtitle(slot.startIso, slot.endIso, tutor.perSegmentMinor)}
              badges={
                !trialUsed && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="size-3" aria-hidden />
                    Trial −{100 - TRIAL_PRICE_PERCENT}%
                  </Badge>
                )
              }
              actions={
                <BookButton
                  tutorId={tutorId}
                  studentId={user.id}
                  startIso={slot.startIso}
                  endIso={slot.endIso}
                  perSegmentMinor={tutor.perSegmentMinor}
                  trialUsed={trialUsed}
                  replacementGrantId={replacementGrant?.id}
                />
              }
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Slots shown respect this tutor&apos;s weekly availability and minimum-notice window. Booking
        is verified again by the scheduling domain before it&apos;s confirmed.
      </p>

      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-headline">
        Reviews ({tutorReviews.length})
      </h2>
      {tutorReviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tutorReviews.slice(0, 10).map((review) => (
            <Card key={review.id}>
              <CardContent className="py-4">
                <p className="text-sm font-medium">{'★'.repeat(review.rating)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Link href="/tutors" className="mt-2 inline-block">
        <Button variant="outline" size="sm">
          Back to tutors
        </Button>
      </Link>
    </main>
  );
}

function slotSubtitle(startIso: string, endIso: string, perSegmentMinor: number): string {
  const segments = segmentsBetween(startIso, endIso);
  return `${segments} segment${segments === 1 ? '' : 's'} · ${formatMinor(perSegmentMinor)} each`;
}

function dateKeyPlus(key: string, offset: number): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
