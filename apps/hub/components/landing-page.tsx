import { Badge, Button, Card, CardContent } from '@mojo/shared/ui';
import { BookOpen, CalendarClock, GraduationCap, MonitorPlay, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  {
    icon: MonitorPlay,
    title: 'Live 1-on-1 labs',
    body: 'Meet your tutor in a real-time video lesson with a shared whiteboard and files — learning that actually feels alive.',
  },
  {
    icon: CalendarClock,
    title: 'Flexible scheduling',
    body: 'Book slots that fit your week. Sessions sync straight into your calendar so you never miss a lesson.',
  },
  {
    icon: BookOpen,
    title: 'Pay per lesson',
    body: 'No subscriptions, no lock-in. Pay for the lessons you take, and get automatic refunds if a session is cancelled.',
  },
];

const STEPS = [
  {
    icon: Users,
    title: 'Find your tutor',
    body: 'Browse vetted tutors by subject, availability and reviews.',
  },
  {
    icon: CalendarClock,
    title: 'Book a slot',
    body: 'Choose a time that works and confirm your booking in one tap.',
  },
  {
    icon: MonitorPlay,
    title: 'Learn live',
    body: 'Join the lesson lab, learn in real time, and leave with real progress.',
  },
];

export function LandingPage() {
  return (
    <main className="bg-background">
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-28">
          <div>
            <Badge variant="primary" className="mb-5 gap-1.5">
              <Sparkles className="size-3.5" />
              Live learning, made simple
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-headline sm:text-5xl lg:text-6xl">
              Find your tutor.
              <br />
              Book a lesson.
              <br />
              <span className="text-primary">Learn live.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              Mojo connects you with vetted tutors for 1-on-1 live lessons in your subjects —
              real-time video, shared whiteboards and flexible scheduling.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button size="lg">Start learning</Button>
              </Link>
              <Link href="/apply">
                <Button size="lg" variant="outline">
                  Become a tutor
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" />
                4.9/5 rated by students
              </span>
              <span className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                200+ vetted tutors
              </span>
            </div>
          </div>

          <div className="hidden lg:block">
            <Card className="p-6 shadow-[0_20px_60px_-20px_var(--primary)]">
              <CardContent className="flex flex-col gap-4 p-0">
                {[
                  {
                    subj: 'Maths · Amara O.',
                    when: 'Today · 4:00 PM',
                    tint: 'bg-primary/15 text-primary',
                  },
                  {
                    subj: 'Physics · Tunde A.',
                    when: 'Wed · 6:30 PM',
                    tint: 'bg-tertiary/20 text-tertiary-foreground',
                  },
                  {
                    subj: 'English · Ngozi E.',
                    when: 'Fri · 5:00 PM',
                    tint: 'bg-secondary/15 text-secondary',
                  },
                ].map(({ subj, when, tint }) => (
                  <div
                    key={subj}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-headline">{subj}</p>
                      <p className="text-xs text-muted-foreground">{when}</p>
                    </div>
                    <Badge className={tint}>Live</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="why-mojo" className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="font-display text-center text-3xl font-extrabold text-headline">
          Tutoring for real life
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Everything a great lesson needs, in one place — for students and tutors alike.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <span className="mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display text-lg font-bold text-headline">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-center text-3xl font-extrabold text-headline">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <div
                key={title}
                className="relative rounded-xl border border-border bg-background p-6"
              >
                <span className="font-display absolute -top-4 left-6 inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                  {index + 1}
                </span>
                <Icon className="mb-3 mt-2 size-6 text-primary" />
                <h3 className="font-display text-lg font-bold text-headline">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-secondary/15 p-10 text-center sm:p-14">
          <h2 className="font-display text-3xl font-extrabold text-headline sm:text-4xl">
            Your next lesson is one click away
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Sign up free as a student, or apply to teach and start earning on your schedule.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Start learning</Button>
            </Link>
            <Link href="/apply">
              <Button size="lg" variant="outline">
                Become a tutor
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
