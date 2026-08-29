import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHub } from '../../demo/composition-root';
import { formatMinor } from '../../lib/format';
import { type CurrentUser, currentUser } from '../../lib/session';

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'tutor' && user.role !== 'student') redirect('/tutor');

  const hub = getHub();
  const record = await hub.identity.userById(user.id);
  const joined = record ? new Date(record.createdAt).toLocaleDateString() : '—';

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-headline">Profile</h1>
      {user.role === 'tutor' ? (
        <TutorProfileCard user={user} />
      ) : (
        <StudentProfileCard user={user} />
      )}
      <AccountCard user={user} joined={joined} />
    </main>
  );
}

function StudentProfileCard({ user }: { user: CurrentUser }) {
  return (
    <Card className="mb-4">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-6">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <div>
            <p className="font-display text-lg font-bold text-headline">{user.name || 'Student'}</p>
            <p className="text-sm text-muted-foreground">
              <Badge variant="secondary">Student</Badge> — learning live on mojo.
            </p>
          </div>
        </div>
        <Link href="/tutors">
          <Button>Book a lesson</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

async function TutorProfileCard({ user }: { user: CurrentUser }) {
  const hub = getHub();
  const [profile, listing, performance, wallet] = await Promise.all([
    hub.profile.byTutor(user.id),
    hub.discovery.search({}).then((results) => results.find((r) => r.tutorId === user.id)),
    hub.performance.byTutor(user.id),
    hub.wallet.forTutor(user.id),
  ]);

  return (
    <Card className="mb-4">
      <CardContent className="py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={profile?.displayName ?? user.name} />
            <div>
              <p className="font-display text-lg font-bold text-headline">
                {profile?.displayName ?? user.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(profile?.subjects ?? []).join(' · ') || 'Tutor'} ·{' '}
                <span className="capitalize">{performance?.level ?? 'entry'}</span> level
              </p>
            </div>
          </div>
          <Link href="/tutor/availability">
            <Button variant="outline" size="sm">
              Edit availability
            </Button>
          </Link>
        </div>

        {profile?.bio && (
          <p className="mt-4 max-w-prose text-sm text-muted-foreground">{profile.bio}</p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            label="Rate"
            value={listing ? `${formatMinor(listing.perSegmentMinor)}/segment` : '—'}
          />
          <Stat
            label="Rating"
            value={listing && listing.rating > 0 ? `${listing.rating.toFixed(1)}★` : 'New tutor'}
          />
          <Stat label="Wallet" value={formatMinor(wallet.balance.amountMinor)} />
        </div>
      </CardContent>
    </Card>
  );
}

function AccountCard({ user, joined }: { user: CurrentUser; joined: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-headline">Name</span> — {user.name || '—'}
        </p>
        <p>
          <span className="font-medium text-headline">Email</span> — {user.email}
        </p>
        <p>
          <span className="font-medium text-headline">Member since</span> — {joined}
        </p>
      </CardContent>
    </Card>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex size-12 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary"
    >
      {initials(name)}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-headline">{value}</p>
    </div>
  );
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
