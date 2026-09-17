import { Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import Link from 'next/link';
import { ApplyForm, type ApplyFormInitial } from '../../components/apply-form';
import { getHub } from '../../demo/composition-root';
import { currentUser } from '../../lib/session';

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await currentUser();
  const hub = getHub();
  const subjectOptions = (await hub.catalog.options()).flatMap((group) => group.subjects);
  const params = await searchParams;
  const editMode = params.edit === '1';

  if (user) {
    const [application, profile] = await Promise.all([
      hub.profile.applicationForTutor(user.id),
      hub.profile.byTutor(user.id),
    ]);

    if (application && (application.status === 'pending' || application.status === 'in_review')) {
      return (
        <main className="mx-auto max-w-2xl p-6">
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <p>
                {application.status === 'in_review'
                  ? 'A reviewer has picked up your application — hang tight!'
                  : 'Your application is in the queue for review.'}
              </p>
              <p className="text-xs text-muted-foreground">
                Status: <span className="font-medium">{application.status}</span> · submitted{' '}
                {new Date(application.submittedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </main>
      );
    }

    if (application?.status === 'rejected') {
      return (
        <main className="mx-auto w-full max-w-6xl p-6 lg:p-10">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-headline">
              Not quite yet — let&apos;s fix it
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              A reviewer left a note on your application. Edit below and resubmit whenever
              you&apos;re ready — it goes back to the end of the queue.
            </p>
          </div>
          <Card className="mb-6 border-secondary/50">
            <CardHeader>
              <CardTitle>Reviewer note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                {application.reviewNote ||
                  'No reason was recorded — apply again with your best foot forward.'}
              </p>
            </CardContent>
          </Card>
          <ApplicationFormCard
            signedIn
            name={user.name}
            email={user.email}
            subjectOptions={subjectOptions}
            initial={initialFromApplication(application)}
          />
        </main>
      );
    }

    if (profile && !editMode) {
      return (
        <main className="mx-auto max-w-2xl p-6">
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <p>You are already a tutor.</p>
              <div className="flex gap-2">
                <Link href="/tutor">
                  <Button size="sm">Go to your hub</Button>
                </Link>
                <Link href="/apply?edit=1">
                  <Button size="sm" variant="outline">
                    Update profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      );
    }

    if (profile && editMode) {
      return (
        <main className="mx-auto w-full max-w-6xl p-6 lg:p-10">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-headline">Update your profile</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Your live profile stays up until a reviewer approves the update.
            </p>
          </div>
          <ApplicationFormCard
            signedIn
            name={user.name}
            email={user.email}
            subjectOptions={subjectOptions}
            initial={
              application ? initialFromApplication(application) : initialFromProfile(profile)
            }
          />
        </main>
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-6 lg:p-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-headline">Become a mojo tutor</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          A 5-minute onboarding — pick your subjects, tell students what makes your lessons click,
          and you&apos;re through to tutor review. No account needed to start.
        </p>
      </div>
      <ApplicationFormCard
        signedIn={Boolean(user)}
        name={user?.name ?? ''}
        email={user?.email ?? ''}
        subjectOptions={subjectOptions}
      />
    </main>
  );
}

function ApplicationFormCard({
  signedIn,
  name,
  email,
  subjectOptions,
  initial,
}: {
  signedIn: boolean;
  name: string;
  email: string;
  subjectOptions: string[];
  initial?: ApplyFormInitial;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application</CardTitle>
      </CardHeader>
      <CardContent>
        <ApplyForm
          signedIn={signedIn}
          name={name}
          email={email}
          subjectOptions={subjectOptions}
          initial={initial}
        />
      </CardContent>
    </Card>
  );
}

function initialFromApplication(application: {
  subjects: readonly string[];
  languages: readonly string[];
  bio: string;
  displayName: string;
  photoUrl: string;
  education: string;
  certifications: readonly string[];
  introVideoUrl: string;
  timezone: string;
  availability: readonly {
    id: string;
    weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    startMinute: number;
    endMinute: number;
  }[];
}): ApplyFormInitial {
  return {
    subjects: application.subjects,
    languages: application.languages,
    bio: application.bio,
    displayName: application.displayName,
    photoUrl: application.photoUrl,
    education: application.education,
    certifications: application.certifications,
    introVideoUrl: application.introVideoUrl,
    timezone: application.timezone,
    availability: application.availability,
  };
}

function initialFromProfile(profile: {
  subjects: readonly string[];
  languages: readonly string[];
  bio: string;
  displayName: string;
  photoUrl: string;
  education: string;
  timezone: string;
}): ApplyFormInitial {
  return {
    subjects: profile.subjects,
    languages: profile.languages,
    bio: profile.bio,
    displayName: profile.displayName,
    photoUrl: profile.photoUrl,
    education: profile.education,
    certifications: [],
    introVideoUrl: '',
    timezone: profile.timezone,
    availability: [],
  };
}
