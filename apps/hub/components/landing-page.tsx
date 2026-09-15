import { Badge, Button, Card, CardContent } from '@mojo/shared/ui';
import {
  BadgeCheck,
  BookOpen,
  Bot,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Eye,
  GraduationCap,
  Heart,
  HeartHandshake,
  Languages,
  Mic,
  MonitorPlay,
  Music,
  PartyPopper,
  PhoneOff,
  Plus,
  Rocket,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Users,
  Video,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export interface SubjectCategory {
  label: string;
  subjects: string[];
}

export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  {
    label: 'Languages',
    subjects: [
      'English',
      'Spanish',
      'French',
      'German',
      'Mandarin',
      'Cantonese',
      'Arabic',
      'Japanese',
      'Korean',
      'Portuguese',
      'Italian',
      'Russian',
      'Hindi',
      'Bengali',
      'Dutch',
      'Turkish',
      'Polish',
      'Ukrainian',
      'Romanian',
      'Greek',
      'Swedish',
      'Thai',
      'Vietnamese',
      'Indonesian',
      'Malay',
      'Tagalog',
      'Swahili',
      'Urdu',
      'Persian',
      'Hebrew',
      'Czech',
      'Hungarian',
      'Finnish',
      'Norwegian',
      'Danish',
    ],
  },
  {
    label: 'Maths & Science',
    subjects: [
      'Mathematics',
      'Algebra',
      'Geometry',
      'Calculus',
      'Statistics',
      'Trigonometry',
      'Physics',
      'Chemistry',
      'Biology',
      'Environmental Science',
      'Astronomy',
      'Logic',
      'Discrete Mathematics',
      'Linear Algebra',
      'Number Theory',
    ],
  },
  {
    label: 'Arts & Music',
    subjects: [
      'Drawing',
      'Painting',
      'Sculpture',
      'Photography',
      'Graphic Design',
      'Music Theory',
      'Piano',
      'Guitar',
      'Violin',
      'Drums',
      'Singing',
      'Creative Writing',
      'Poetry',
      'Drama',
      'Acting',
      'Dance',
      'Film Making',
      'Animation',
      'Interior Design',
      'Fashion Design',
    ],
  },
  {
    label: 'Business',
    subjects: [
      'Marketing',
      'Digital Marketing',
      'SEO',
      'Content Marketing',
      'Finance',
      'Accounting',
      'Bookkeeping',
      'Financial Analysis',
      'Entrepreneurship',
      'Business Strategy',
      'Management',
      'Leadership',
      'Human Resources',
      'Project Management',
      'Sales',
      'Negotiation',
      'Public Speaking',
      'Presentation Skills',
      'Business Writing',
    ],
  },
  {
    label: 'Technology',
    subjects: [
      'Programming',
      'Web Development',
      'Mobile Development',
      'Data Science',
      'Machine Learning',
      'Artificial Intelligence',
      'Cybersecurity',
      'Cloud Computing',
      'DevOps',
      'Database Design',
      'UI/UX Design',
      'Blockchain',
      'Game Development',
      'Python',
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'SQL',
      'Excel',
      'Google Sheets',
    ],
  },
  {
    label: 'Social Sciences',
    subjects: [
      'Psychology',
      'Sociology',
      'Anthropology',
      'History',
      'Philosophy',
      'Political Science',
      'Economics',
      'Geography',
      'Cultural Studies',
      'International Relations',
      'Social Work',
      'Communication Studies',
      'Media Studies',
      'Journalism',
      'Law',
      'Criminology',
    ],
  },
  {
    label: 'Hobbies',
    subjects: [
      'Cooking',
      'Baking',
      'Gardening',
      'Chess',
      'Board Games',
      'Crafts',
      'Knitting',
      'Woodworking',
      'Pottery',
      'Fitness',
      'Yoga',
      'Meditation',
      'Martial Arts',
      'Hiking',
      'Camping',
      'Fishing',
      'Bird Watching',
      'Pet Care',
      'Astronomy',
      'Magic Tricks',
      'Origami',
    ],
  },
];

type Tutor = {
  name: string;
  initials: string;
  tint: string;
  tagline: string;
  subjects: string[];
  rating: number;
  reviews: number;
  segmentsCents: number;
};

const TUTORS: Tutor[] = [
  {
    name: 'Amara O.',
    initials: 'AO',
    tint: 'bg-[color-mix(in_oklab,var(--primary)_28%,var(--background))]',
    tagline: 'Make math click — from fractions to calculus',
    subjects: ['Math', 'SAT Prep'],
    rating: 4.9,
    reviews: 214,
    segmentsCents: 1800,
  },
  {
    name: 'Diego R.',
    initials: 'DR',
    tint: 'bg-[color-mix(in_oklab,var(--secondary)_22%,var(--background))]',
    tagline: 'Conversational Spanish from day one',
    subjects: ['Spanish'],
    rating: 5.0,
    reviews: 168,
    segmentsCents: 1500,
  },
  {
    name: 'Priya S.',
    initials: 'PS',
    tint: 'bg-[color-mix(in_oklab,var(--tertiary)_38%,var(--background))]',
    tagline: 'Physics without the fear — clear, visual, patient',
    subjects: ['Physics', 'Calculus'],
    rating: 4.8,
    reviews: 97,
    segmentsCents: 2200,
  },
  {
    name: 'Tom W.',
    initials: 'TW',
    tint: 'bg-[color-mix(in_oklab,var(--primary)_20%,var(--secondary)_10%,var(--background))]',
    tagline: 'Piano fundamentals for busy teens & adults',
    subjects: ['Piano', 'Music Theory'],
    rating: 4.9,
    reviews: 143,
    segmentsCents: 2000,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "My daughter went from dreading algebra to asking for extra sessions. Being charged by the segment means we never pay for time we don't use.",
    name: 'Rachel M.',
    detail: 'parent of a 9th-grader',
  },
  {
    quote:
      'I booked my first Spanish lesson on a Sunday night and was speaking in full sentences within three weeks. The scheduling just works.',
    name: 'Kevin L.',
    detail: 'learner since January',
  },
  {
    quote:
      "As a tutor, verification gave me instant credibility. Lessons auto-publish once I'm approved, and payouts land after every completed session.",
    name: 'Diego R.',
    detail: 'verified tutor',
  },
];

const FALLBACK_CATEGORIES = [
  { icon: Languages, label: 'Spanish' },
  { icon: Languages, label: 'English' },
  { icon: GraduationCap, label: 'Math' },
  { icon: Rocket, label: 'Physics' },
  { icon: Music, label: 'Piano' },
  { icon: Video, label: 'Robotics' },
];

const AVATAR_TINTS = [
  'bg-[color-mix(in_oklab,var(--primary)_45%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--secondary)_40%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--tertiary)_55%,var(--background))]',
];

/** Best-effort icon per known subject; anything else gets the graduation cap.
function categoryIcon(label: string) {
  const known: Record<string, typeof Languages> = {
    spanish: Languages,
    english: Languages,
    french: Languages,
    german: Languages,
    math: GraduationCap,
    physics: Rocket,
    chemistry: Rocket,
    biology: Rocket,
    piano: Music,
    guitar: Music,
    robotics: Video,
    coding: Video,
  };
  return known[label.toLowerCase()] ?? GraduationCap;
} */

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

const goals = [
  { label: 'Hold a 10-minute conversation', done: true },
  { label: 'Order confidently on a trip', done: true },
  { label: 'Watch a film without subtitles', done: false },
];

function Stars({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="size-4 fill-tertiary text-tertiary" />
      ))}
      <span className="sr-only">Rated 5 out of 5</span>
    </span>
  );
}

function AvatarStack() {
  return (
    <div className="flex -space-x-2">
      {['KL', 'RM', 'JT', 'AS'].map((initials, i) => (
        <span
          key={initials}
          className={`grid size-9 place-items-center rounded-full border-2 border-background text-xs font-semibold text-headline ${AVATAR_TINTS[i % AVATAR_TINTS.length]}`}
        >
          {initials}
        </span>
      ))}
    </div>
  );
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  return (
    <article className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <span
          className={`font-display grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-headline ${tutor.tint}`}
        >
          {tutor.initials}
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1 truncate font-semibold text-headline">
            {tutor.name}
            <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />
          </h3>
          <p className="truncate text-sm text-muted-foreground">{tutor.tagline}</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {tutor.subjects.map((s) => (
          <li
            key={s}
            className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
          >
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-end justify-between pt-5">
        <div>
          <div className="flex items-center gap-1.5">
            <Stars />
            <span className="text-sm font-semibold text-headline">{tutor.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({tutor.reviews})</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <strong className="text-base text-headline">${tutor.segmentsCents / 100}</strong> per
            segment
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/register">Book</Link>
        </Button>
      </div>
    </article>
  );
}

export function LandingPage() {
  // const subjects = SUBJECT_CATEGORIES;
  const categories = FALLBACK_CATEGORIES;

  return (
    <main className="bg-background">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-96 max-w-3xl rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_25%,transparent),transparent)] blur-2xl"
        />
        <div className="relative mx-auto max-w-3xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <BadgeCheck className="size-3.5 text-primary" /> Live 1-on-1 sessions · verified tutors
          </span>

          <h1 className="mt-5 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-headline sm:text-6xl lg:text-7xl">
            Learn faster with a<br />
            <em className="text-secondary italic">great</em> tutor
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Real tutors, real time slots, real progress. Book a session in minutes and pay only for
            the time you actually spend learning.
          </p>

          <form action="/signup" className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="subject">
              What do you want to learn?
            </label>
            <input
              id="subject"
              name="subject"
              placeholder="What do you want to learn?"
              className="h-12 flex-1 rounded-full border border-input bg-background px-5 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
            />
            <Button type="submit" size="lg" className="rounded-full px-8">
              Find a tutor
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <AvatarStack />
            <Stars />
            <span>
              <strong className="text-headline">4.9</strong> average across 2,300+ sessions
            </span>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.map(({ icon: Icon, label }) => (
              <li key={label}>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
                >
                  <Icon className="size-3.5" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border px-4 py-20 sm:px-6">
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

      <section id="why-mojo" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
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

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Wallet className="size-3.5 text-primary" /> Free to join · no subscription
            </span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-headline sm:text-5xl">
              One click from curious to <em className="text-secondary italic">confident</em>
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Create a free account, browse verified tutors, and book your first live session in
              minutes. You only ever pay for the minutes you learn.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                {
                  icon: BadgeCheck,
                  text: 'Every tutor identity-checked before their lesson goes live',
                },
                {
                  icon: CalendarCheck2,
                  text: 'Real time slots with instant, conflict-free confirmation',
                },
                {
                  icon: Wallet,
                  text: 'Charged per 15-minute segment — only after class actually happens',
                },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex mt-0.5 items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20">
                    <Icon className="size-3.5 text-primary" />
                  </span>
                  <span className="mt-0.5 text-sm text-foreground">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="px-8">
                <Link href="/signup">Sign up free</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="px-6">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          <div
            aria-hidden
            className="relative mx-auto hidden aspect-square w-full max-w-md sm:block"
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)] blur-xl" />

            <div className="absolute inset-x-8 top-10 bottom-16 rounded-lg border border-border bg-card p-4 shadow-lg animate-mupta-float">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary">
                  <span className="size-2 animate-segment-pulse rounded-full bg-secondary" /> LIVE
                </span>
                <span className="font-mono text-xs text-muted-foreground">24:13 / 30:00</span>
              </div>

              <div className="grid h-[calc(100%-4.5rem)] place-items-center py-4">
                <span className="font-display grid size-24 animate-mupta-ring place-items-center rounded-full bg-[color-mix(in_oklab,var(--primary)_28%,var(--background))] text-2xl font-semibold text-headline">
                  AR
                </span>
                <p className="mt-3 text-sm text-muted-foreground">
                  Amara is teaching present perfect…
                </p>
                <div className="mt-3 flex h-6 items-end gap-1" aria-hidden>
                  {[
                    [0.9, 1],
                    [0.5, 2],
                    [1.1, 3],
                    [0.7, 4],
                    [1.3, 5],
                    [0.6, 6],
                  ].map(([d, n]) => (
                    <span
                      key={n}
                      className="h-full w-1 origin-bottom rounded-full bg-primary"
                      style={{ animation: `mupta-bar 1s ease-in-out ${d}s infinite` }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-3 border-t border-border pt-3">
                <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Mic className="size-4" />
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Video className="size-4" />
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-secondary text-white">
                  <PhoneOff className="size-4" />
                </span>
              </div>
            </div>

            <div className="absolute -top-1 right-0 flex max-w-52 items-start gap-2 rounded-lg rounded-br-sm border border-border bg-popover p-3 shadow-md animate-mupta-bubble">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-xs leading-snug text-foreground">
                “I have lived here for three years.” Perfect!
              </p>
            </div>

            <div
              className="absolute top-40 -left-4 flex items-center gap-2 rounded-full border border-border bg-popover px-3 py-2 shadow-md animate-mupta-float"
              style={{ animationDelay: '1.2s' }}
            >
              <Wallet className="size-4 text-secondary" />
              <span className="text-xs font-medium text-headline">+$4.50 · 3 segments</span>
            </div>

            <div
              className="absolute right-4 -bottom-2 flex items-center gap-2 rounded-full border border-border bg-popover px-3 py-2 shadow-md animate-mupta-bubble"
              style={{ animationDelay: '3s' }}
            >
              <Timer className="size-4 text-primary" />
              <span className="text-xs font-medium text-headline">Segment 3 of 4</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-center text-3xl font-extrabold text-headline">
            How Mojo works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-muted-foreground">
            Three steps between you and your first live session.
          </p>
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

      <section className="border-b border-border bg-card/60 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div
            aria-hidden
            className="relative mx-auto hidden aspect-square w-full max-w-md order-0 lg:order-first sm:block"
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--secondary)_18%,transparent),transparent)] blur-xl" />

            <div className="absolute inset-x-6 top-6 bottom-24 flex flex-col justify-center gap-4">
              <div className="rounded-lg border border-border bg-background/60 p-4 opacity-70">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Bot className="size-4" />
                  </span>
                  <p className="text-xs font-medium text-muted-foreground">
                    Any learning app · instant
                  </p>
                </div>
                <p className="mt-2.5 line-through decoration-secondary/70 text-sm text-muted-foreground">
                  “Here is a list of 20 rules about the present perfect…”
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Same answer for everyone. No one notices you.
                </p>
              </div>

              <div className="relative rounded-lg border border-primary/40 bg-popover p-4 shadow-lg animate-mupta-float">
                <div className="flex items-center gap-2.5">
                  <span className="font-display grid size-9 animate-mupta-ring place-items-center rounded-full bg-[color-mix(in_oklab,var(--primary)_28%,var(--background))] text-sm font-semibold text-headline">
                    AR
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-headline">Amara · your tutor</p>
                    <p className="text-[11px] text-muted-foreground">
                      live in session · segment 3 of 4
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 px-1" data-phase="typing">
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className="size-1.5 rounded-full bg-muted-foreground"
                      style={{ animation: `mupta-typing 6s ease-in-out ${n * 0.18}s infinite` }}
                    />
                  ))}
                </div>

                <p className="mt-2 animate-mupta-bubble text-sm leading-snug text-foreground">
                  “Almost! Try <strong>“I’ve been living here”</strong> — say it once more, I’m
                  listening.”
                </p>
              </div>
            </div>

            <div className="absolute right-0 bottom-10 w-52 rounded-lg border border-border bg-popover p-3 shadow-md">
              <div className="flex items-center justify-between text-[11px] font-medium text-headline">
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-primary" /> Fluency this week
                </span>
                <span>+12%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full origin-left rounded-full bg-primary animate-mupta-grow" />
              </div>
            </div>

            <div
              className="absolute top-8 -left-2 flex items-center gap-1.5 rounded-full border border-border bg-popover px-3 py-1.5 shadow-md animate-mupta-float"
              style={{ animationDelay: '0.8s' }}
            >
              <Eye className="size-3.5 text-secondary" />
              <span className="text-[11px] font-medium text-headline">Notices hesitation</span>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <HeartHandshake className="size-3.5 text-secondary" /> Why mupta works
            </span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-headline sm:text-5xl">
              The fastest way to learn will always be{' '}
              <em className="text-secondary italic">human</em>
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Apps can drill you forever without moving the needle, because they never ask why
              you’re stuck. A great tutor hears the hesitation, names the mistake, and fixes it with
              you — in real time.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                {
                  icon: Eye,
                  text: 'A tutor notices what an algorithm can’t — habits, gaps, and false confidence',
                },
                {
                  icon: Zap,
                  text: 'Feedback lands the second you make the mistake, not at the end of a quiz',
                },
                {
                  icon: HeartHandshake,
                  text: 'Someone expects you next Tuesday — accountability no streak can replace',
                },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex mt-0.5 items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary/15">
                    <Icon className="size-3.5 text-secondary" />
                  </span>
                  <span className="text-sm text-foreground">{text}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 px-8">
              <Link href="#tutors">Meet your tutor</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Heart className="size-3.5 fill-secondary text-secondary" /> Humans, not bots
            </span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-headline sm:text-5xl">
              Instead of cold AI bots, we champion{' '}
              <em className="text-secondary italic">human tutors</em> who are as invested in your
              learning journey as you are.
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Your tutor learns your goals, remembers where you struggled last week, and rebuilds
              the plan when life gets busy. Progress isn’t a dashboard to them — it’s personal.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                {
                  icon: Target,
                  text: 'Goals are tracked by a person who adjusts them with you, not a streak counter',
                },
                {
                  icon: CalendarCheck2,
                  text: 'Check-ins between sessions — “how did the presentation go?”',
                },
                {
                  icon: PartyPopper,
                  text: 'Wins get celebrated by someone who watched you earn them',
                },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex mt-0.5 items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary/15">
                    <Icon className="size-3.5 text-secondary" />
                  </span>
                  <span className="text-sm text-foreground">{text}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 px-8">
              <Link href="/signup">Find someone in your corner</Link>
            </Button>
          </div>

          <div
            aria-hidden
            className="relative mx-auto hidden aspect-square w-full max-w-md order-first sm:block lg:order-last"
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--tertiary)_20%,transparent),transparent)] blur-xl" />

            {/* Journey plan, ticking off as the tutor reworks it with you */}
            <div className="absolute inset-x-6 top-8 rounded-lg border border-border bg-card p-5 shadow-sm animate-mupta-float">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Your journey · Spanish
                </p>
                <TrendingUp className="size-4 text-primary" />
              </div>
              <ul className="mt-3.5 space-y-3">
                {goals.map((goal, i) => (
                  <li key={goal.label} className="flex items-center gap-2.5 text-sm">
                    {goal.done ? (
                      <CheckCircle2
                        className="size-4.5 shrink-0 fill-primary/15 text-primary animate-mupta-pop"
                        style={{ animationDelay: `${0.7 + i * 0.9}s` }}
                      />
                    ) : (
                      <span className="size-4.5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/40" />
                    )}
                    <span className={goal.done ? 'text-headline' : 'text-muted-foreground'}>
                      {goal.label}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between text-[11px] font-medium text-headline">
                  <span>Sessions toward B2</span>
                  <span>14 / 20</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full w-full origin-left rounded-full bg-secondary animate-mupta-grow"
                    style={{ animationDuration: '6s' }}
                  />
                </div>
              </div>
            </div>

            {/* The tutor — hearts rising off a live presence dot */}
            <div className="absolute bottom-14 left-6 flex flex-col items-center gap-2.5">
              <div className="relative">
                <span className="font-display grid size-14 place-items-center rounded-full bg-[color-mix(in_oklab,var(--secondary)_35%,var(--background))] text-base font-semibold text-headline shadow-md">
                  DR
                </span>
                <span className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full border-2 border-background bg-primary" />
                {[0, 1, 2].map((n) => (
                  <Heart
                    key={n}
                    className="absolute -top-2 left-1/2 size-4 fill-secondary text-secondary animate-mupta-heart"
                    style={{ animationDelay: `${n * 0.85}s` }}
                  />
                ))}
              </div>
              <p className="rounded-full border border-border bg-popover px-2.5 py-1 text-[11px] font-medium text-headline shadow-sm">
                Diego · invested since day one
              </p>
            </div>

            {/* Encouragement, unprompted */}
            <div className="absolute top-40 right-0 flex max-w-52 items-start gap-2 rounded-lg rounded-br-sm border border-border bg-popover p-3 shadow-md animate-mupta-bubble">
              <PartyPopper className="mt-0.5 size-4 shrink-0 text-secondary" />
              <p className="text-xs leading-snug text-foreground">
                That was the hardest tense yet — you nailed it.
              </p>
            </div>

            <div
              className="absolute bottom-24 right-2 flex items-center gap-1.5 rounded-full border border-border bg-popover px-3 py-1.5 shadow-md animate-mupta-float"
              style={{ animationDelay: '1.6s' }}
            >
              <CalendarCheck2 className="size-3.5 text-primary" />
              <span className="text-[11px] font-medium text-headline">
                Moved Thursday’s slot — no charge
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="tutors" className="border-b border-border bg-card/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl font-semibold tracking-tight text-headline">
                Meet a few of our tutors
              </h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                Identity-checked, learner-rated, paid by the segment they actually teach.
              </p>
            </div>
            <Link href="/signup">
              <Button size="default" variant="outline">
                <Plus /> See all tutors
              </Button>
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TUTORS.map((tutor) => (
              <TutorCard key={tutor.name} tutor={tutor} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center font-display text-4xl font-semibold tracking-tight text-headline">
          Loved by learners and tutors
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-lg border border-border bg-card p-6">
              <Stars />
              <blockquote className="mt-3 text-sm leading-relaxed text-foreground">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold text-headline">{t.name}</span>{' '}
                <span className="text-muted-foreground">· {t.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl bg-linear-to-br from-primary/15 via-background to-secondary/15 p-10 text-center sm:p-14">
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
