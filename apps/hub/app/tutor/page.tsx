import { isMojoPlusActive } from '@mojo/mojo-plus/domain';
import { TutorOutreachCard } from '@mojo/mojo-plus/feature';
import { DEFAULT_SEGMENT_RATE_NGN } from '@mojo/pricing/domain';
import { CalendarDialog } from '@mojo/scheduling/feature';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import { CalendarDays, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { CalendarExportButton } from '../../components/calendar-export-button';
import { DisputeButton } from '../../components/dispute-button';
import { LevelBadge } from '../../components/level-badge';
import { MojoPlusSection } from '../../components/mojo-plus-section';
import { RequestPayoutButton } from '../../components/request-payout-button';
import {
  CancelSessionButton,
  CompleteSessionButton,
  StartSessionButton,
} from '../../components/session-actions';
import {
  parseSessionView,
  SessionGridCard,
  SessionListCard,
  toneForStatus,
} from '../../components/session-cards';
import { NoShowButton, RecapCard, RescheduleForm } from '../../components/session-feedback';
import { SessionStatusBadge } from '../../components/session-status-badge';
import { SessionViewToggle } from '../../components/session-view-toggle';
import { GroupLabBadge } from '../../components/group-lab-badge';
import { GroupLabCreateForm } from '../../components/group-lab-create-form';
import { GroupLabManage } from '../../components/group-lab-manage';
import { getHub } from '../../demo/composition-root';
import { formatMinor } from '../../lib/format';
import { currentUser } from '../../lib/session';

export default async function TutorHome({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await currentUser();
  if (user?.role !== 'tutor') return null;

  const params = await searchParams;
  const view = parseSessionView(params.view);

  const hub = getHub();
  const [sessions, performance, wallet, interests, subscription, transactions] = await Promise.all([
    hub.scheduling.sessionsByTutor(user.id),
    hub.performance.byTutor(user.id),
    hub.wallet.forTutor(user.id),
    hub.interests.forTutor(user.id),
    hub.plus.subscription(user.id),
    hub.wallet.transactions(user.id),
  ]);

  const upcoming = sessions.filter((s) => s.status === 'booked' || s.status === 'confirmed');

  const groupLabs = await hub.groups.labsByTutor(user.id);
  const groupLabRows = await Promise.all(
    groupLabs.map(async (lab) => {
      const members = await hub.groups.members(lab.id);
      const seatsTaken = members.filter(
        (m) => m.status !== 'cancelled' && m.status !== 'no_show',
      ).length;
      return {
        id: lab.id,
        title: lab.title,
        startIso: lab.startIso,
        endIso: lab.endIso,
        maxSeats: lab.maxSeats,
        status: lab.status,
        lockedSize: lab.lockedSize,
        seatsTaken,
      };
    }),
  );

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-headline">
          Hi {user.name.split(' ')[0] || user.email.split('@')[0]}
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/tutor/availability">
            <Button variant="outline" size="sm">
              Edit availability
            </Button>
          </Link>
          <RequestPayoutButton
            balanceMinor={wallet.balance.amountMinor}
            currency={wallet.balance.currency}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-extrabold text-headline">
              {upcoming.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Level</CardTitle>
          </CardHeader>
          <CardContent>
            {performance && <LevelBadge level={performance.level} />}
            {performance && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatHours(performance.cumulativeHoursTaught)} taught ·{' '}
                {performance.averageRating.toFixed(1)}★
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-extrabold text-headline">
              {formatMinor(wallet.balance.amountMinor, wallet.balance.currency)}
            </span>
          </CardContent>
        </Card>
        <Link href="/tutor/outreach">
          <TutorOutreachCard
            leadCount={interests.length}
            hasAccess={isMojoPlusActive(subscription)}
          />
        </Link>
      </div>

      <div className="mb-6">
        <MojoPlusSection
          status={subscription?.status ?? null}
          customRateMinor={subscription?.customSegmentRateMinor ?? null}
          defaultRateMinor={DEFAULT_SEGMENT_RATE_NGN[performance?.level ?? 'entry']}
          transactions={transactions.map((t) => ({
            id: t.id,
            kind: t.kind,
            amountMinor: t.amount.amountMinor,
            relatedSessionId: t.relatedSessionId,
            createdAt: t.createdAt,
          }))}
        />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-headline">
          <Users className="size-5 text-primary" aria-hidden />
          Group labs
          <span className="text-sm font-medium text-muted-foreground">({groupLabRows.length})</span>
        </h2>
      </div>
      <div className="mb-6 flex flex-col gap-4">
        <GroupLabManage initialLabs={groupLabRows} />
        <GroupLabCreateForm />
        <p className="text-xs text-muted-foreground">
          Each extra 10 seats drops the per-student price 10%. Locking freezes the size and
          refunds any seats that overpaid on the way in.
        </p>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-headline">
          <CalendarDays className="size-5 text-primary" aria-hidden />
          Sessions
          <span className="text-sm font-medium text-muted-foreground">({sessions.length})</span>
        </h2>
        <SessionViewToggle view={view} />
      </div>
      <div className="mb-6">
        {sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
        {view === 'grid' ? (
          <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
            {(
              await Promise.all(
                sessions.map(async (session) => ({
                  session,
                  student: (await hub.identity.userById(session.studentId))?.name ?? 'Your student',
                  recap:
                    session.status === 'completed' ? await hub.recaps.latestFor(session.id) : null,
                  dispute:
                    session.status === 'completed' || session.status === 'cancelled'
                      ? await hub.trust.forSession(session.id)
                      : null,
                })),
              )
            ).map(({ session, student, recap, dispute }) => (
              <SessionGridCard
                key={session.id}
                startIso={session.startIso}
                endIso={session.endIso}
                tone={toneForStatus(session.status)}
                title={student}
                subtitle={session.isTrial ? 'Trial lesson' : undefined}
                badges={
                  <TutorSessionBadges
                    status={session.status}
                    isTrial={session.isTrial}
                    groupSize={session.groupSize}
                  />
                }
                actions={<TutorSessionActions session={session} studentName={student} />}
              >
                {recap && <RecapCard summary={recap.summary} focusAreas={recap.focusAreas} />}
                {dispute?.status === 'open' && (
                  <p className="text-xs font-medium text-secondary">
                    Dispute open — our team is looking into this lesson.
                  </p>
                )}
                {(session.status === 'completed' || session.status === 'cancelled') && !dispute && (
                  <DisputeButton sessionId={session.id} />
                )}
              </SessionGridCard>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {(
              await Promise.all(
                sessions.map(async (session) => ({
                  session,
                  student: (await hub.identity.userById(session.studentId))?.name ?? 'Your student',
                  recap:
                    session.status === 'completed' ? await hub.recaps.latestFor(session.id) : null,
                  dispute:
                    session.status === 'completed' || session.status === 'cancelled'
                      ? await hub.trust.forSession(session.id)
                      : null,
                })),
              )
            ).map(({ session, student, recap, dispute }) => (
              <SessionListCard
                key={session.id}
                startIso={session.startIso}
                endIso={session.endIso}
                tone={toneForStatus(session.status)}
                title={student}
                subtitle={session.isTrial ? 'Trial lesson' : undefined}
                badges={
                  <TutorSessionBadges
                    status={session.status}
                    isTrial={session.isTrial}
                    groupSize={session.groupSize}
                  />
                }
                actions={<TutorSessionActions session={session} studentName={student} />}
              >
                {recap && <RecapCard summary={recap.summary} focusAreas={recap.focusAreas} />}
                {dispute?.status === 'open' && (
                  <p className="text-xs font-medium text-secondary">
                    Dispute open — our team is looking into this lesson.
                  </p>
                )}
                {(session.status === 'completed' || session.status === 'cancelled') && !dispute && (
                  <DisputeButton sessionId={session.id} />
                )}
              </SessionListCard>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2">
        <CalendarDialog sessions={sessions} />
      </div>
    </main>
  );
}

function formatHours(hours: number): string {
  return hours >= 1000 ? `${(hours / 1000).toFixed(1)}k h` : `${hours.toFixed(0)} h`;
}

function TutorSessionBadges({
  status,
  isTrial,
  groupSize,
}: {
  status: string;
  isTrial: boolean;
  groupSize?: number | null;
}) {
  return (
    <>
      <SessionStatusBadge status={status} />
      {typeof groupSize === 'number' && groupSize > 1 && <GroupLabBadge seats={groupSize} />}
      {isTrial && (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" aria-hidden />
          Trial
        </Badge>
      )}
    </>
  );
}

function TutorSessionActions({
  session,
  studentName,
}: {
  session: { id: string; status: string; tutorId: string; startIso: string; endIso: string };
  studentName: string;
}) {
  return (
    <>
      {(session.status === 'booked' || session.status === 'confirmed') && (
        <CalendarExportButton
          sessionId={session.id}
          title={`Mojo lesson with ${studentName}`}
          startIso={session.startIso}
          endIso={session.endIso}
        />
      )}
      {(session.status === 'booked' || session.status === 'confirmed') && (
        <>
          <CancelSessionButton sessionId={session.id} />
          <NoShowButton sessionId={session.id} />
        </>
      )}
      {session.status === 'booked' && <StartSessionButton sessionId={session.id} />}
      {session.status === 'confirmed' && <CompleteSessionButton sessionId={session.id} />}
      {(session.status === 'booked' || session.status === 'confirmed') && (
        <RescheduleForm sessionId={session.id} tutorId={session.tutorId} />
      )}
      {session.status === 'confirmed' && (
        <Link href={`/tutor/lab/${session.id}`} className="w-full sm:w-auto">
          <Button size="sm" className="w-full">
            Open lab
          </Button>
        </Link>
      )}
    </>
  );
}
