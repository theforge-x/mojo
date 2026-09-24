import { Avatar, Badge } from '@mojo/shared/ui';
import { cn } from '@mojo/shared/util';
import type { AvailabilityWindow } from '@mojo/tutor-profile/domain';
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  Globe,
  ListChecks,
  Lock,
  Mail,
  MonitorPlay,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { ReactNode } from 'react';

const WEEKDAY_LETTERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface WizardArtworkProps {
  step: number;
  signedIn: boolean;
  subjectOptions: string[];
  subjects: string[];
  languages: string[];
  bio: string;
  displayName: string;
  photoUrl: string;
  education: string;
  yearsExperience: string | null;
  certifications: string[];
  introVideoUrl: string;
  timezone: string;
  availability: AvailabilityWindow[];
  name: string;
  email: string;
  password: string;
}

const STEP_META: {
  kicker: string;
  title: string;
  caption: (...counts: number[]) => string;
}[] = [
  {
    kicker: 'Subjects',
    title: 'What you teach',
    caption: (selected: number, total: number) =>
      selected === 0
        ? `Pick as many as you like — all ${total} are fair game.`
        : `${plural(selected, 'subject')} selected of ${total}.`,
  },
  {
    kicker: 'About you',
    title: 'Your teaching style',
    caption: (chars: number) =>
      chars >= 30
        ? `${chars} characters — this reads like a real human.`
        : `Keep going — at least 30 characters (currently ${chars}).`,
  },
  {
    kicker: 'Profile',
    title: 'Your tutor card',
    caption: () => 'This is the card students see when they search for a tutor.',
  },
  {
    kicker: 'Experience',
    title: 'Credentials',
    caption: (count: number) =>
      count === 0
        ? 'Add the qualifications that back up your teaching.'
        : `${plural(count, 'credential')} squared away. Nice.`,
  },
  {
    kicker: 'Intro video',
    title: 'First impressions',
    caption: () => 'A 30–60 second hello goes a long way.',
  },
  {
    kicker: 'Availability',
    title: 'When students can book',
    caption: (windows: number, hours: number) =>
      windows === 0
        ? 'Add at least one weekly window to be bookable.'
        : `${plural(windows, 'window')}, ${plural(Math.round(hours), 'hour')} a week.`,
  },
  {
    kicker: 'Your account',
    title: 'Where we reach you',
    caption: (filled: number) =>
      filled > 0
        ? 'All set — this is where we send review updates.'
        : 'We only email you about your application.',
  },
  {
    kicker: 'Review',
    title: 'Your application recap',
    caption: () => 'Everything here is what you submit.',
  },
];

function clock(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function ArtworkFrame({
  step,
  kicker,
  title,
  caption,
  children,
}: {
  step: number;
  kicker: string;
  title: string;
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-14 size-48 rounded-full bg-primary/15 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-14 size-48 rounded-full bg-secondary/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 bottom-28 size-24 rounded-full bg-tertiary/20 blur-xl"
      />
      <div className="relative flex flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-sm font-bold text-primary">
            {String(step + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {kicker}
            </p>
            <h3 className="mt-0.5 font-display text-xl font-bold text-headline">{title}</h3>
          </div>
        </div>
        {children}
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          {caption}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(step / (STEP_META.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-background', className)}>{children}</div>
  );
}

function SubjectsScene({
  options,
  selected,
  languages,
}: {
  options: string[];
  selected: string[];
  languages: string[];
}) {
  return (
    <Stage className="p-4">
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((subject) => {
          const isSelected = selected.includes(subject);
          return (
            <span
              key={subject}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs',
                isSelected
                  ? 'border-primary bg-primary font-medium text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              {isSelected && <Check className="size-3.5 shrink-0" />}
              <span className="truncate">{subject}</span>
            </span>
          );
        })}
      </div>
      {languages.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="size-3.5 shrink-0 text-primary" />
          <span className="font-medium text-foreground">Teaches in:</span>
          <span className="truncate">{languages.join(' · ')}</span>
        </div>
      )}
    </Stage>
  );
}

function BioScene({ bio }: { bio: string }) {
  return (
    <Stage className="flex min-h-56 flex-col justify-end gap-3 p-5">
      <div className="flex max-w-[85%] items-end gap-2">
        <Avatar name="A" className="size-6 text-[10px]" />
        <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
          ¡Hola! I&apos;m prepping for my Spanish exam — can you help?
        </div>
      </div>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm">
        ¡Claro! Let&apos;s make it yours.
      </div>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary-foreground">
        <p className="line-clamp-4">{bio.trim() || 'Write your intro here…'}</p>
      </div>
    </Stage>
  );
}

function ProfileScene({
  displayName,
  photoUrl,
  education,
  subjects,
}: {
  displayName: string;
  photoUrl: string;
  education: string;
  subjects: string[];
}) {
  return (
    <Stage className="p-5">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <Avatar name={displayName.trim() || 'New tutor'} src={photoUrl || undefined} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-display text-lg font-bold text-headline">
                {displayName.trim() || 'Your name'}
              </p>
              <Badge variant="primary" className="shrink-0 gap-1">
                <BadgeCheck className="size-3" />
                mojo tutor
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {education.trim() || 'Your education'}
            </p>
            {subjects.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {subjects.slice(0, 3).map((subject) => (
                  <Badge key={subject} variant="muted">
                    {subject}
                  </Badge>
                ))}
                {subjects.length > 3 && <Badge variant="muted">+{subjects.length - 3}</Badge>}
              </div>
            )}
          </div>
        </div>
      </div>
    </Stage>
  );
}

function ExperienceScene({
  yearsExperience,
  certifications,
}: {
  yearsExperience: string | null;
  certifications: string[];
}) {
  return (
    <Stage className="p-5">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card/60 py-7 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <Trophy className="size-6" />
        </span>
        <div>
          <p className="font-display text-xl font-bold text-headline">
            {yearsExperience || 'Your experience'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">teaching experience</p>
        </div>
        {certifications.length > 0 ? (
          <div className="flex max-w-[90%] flex-wrap justify-center gap-1.5">
            {certifications.map((certificate) => (
              <span
                key={certificate}
                className="max-w-full truncate rounded-full border border-tertiary/60 bg-tertiary/20 px-2.5 py-1 font-mono text-[11px] text-foreground"
              >
                {certificate}
              </span>
            ))}
          </div>
        ) : (
          <p className="px-6 text-xs text-muted-foreground">
            Add qualifications &amp; certifications on the form.
          </p>
        )}
      </div>
    </Stage>
  );
}

function VideoScene({ introVideoUrl }: { introVideoUrl: string }) {
  return (
    <Stage className="overflow-hidden">
      <div className="relative flex aspect-video items-center justify-center bg-muted">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, color-mix(in oklab, var(--color-primary) 30%, transparent), transparent 60%)',
          }}
        />
        <span className="relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <Play className="size-5 fill-current" />
        </span>
        <span className="absolute bottom-3 right-3 rounded bg-foreground/70 px-1.5 py-0.5 font-mono text-[10px] text-background">
          0:30
        </span>
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground/10">
          <span className="block h-full w-1/3 rounded-r-full bg-primary" />
        </span>
      </div>
      <div className="flex items-center gap-2 p-3">
        <MonitorPlay className="size-4 shrink-0 text-muted-foreground" />
        <p className="truncate text-xs text-muted-foreground">
          {introVideoUrl.trim() || 'No intro video added yet'}
        </p>
      </div>
    </Stage>
  );
}

function AvailabilityScene({
  availability,
  timezone,
}: {
  availability: AvailabilityWindow[];
  timezone: string;
}) {
  const totalHours =
    availability.reduce((sum, w) => sum + Math.max(0, w.endMinute - w.startMinute), 0) / 60;
  const maxLength =
    availability.reduce((max, w) => Math.max(max, w.endMinute - w.startMinute), 0) || 60;

  return (
    <Stage className="p-4">
      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            Weekly availability
          </span>
          <span>{Math.round(totalHours)} hrs / week</span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {WEEKDAY_LETTERS.map((day, weekday) => {
            const windows = availability.filter((w) => w.weekday === weekday);
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">
                  {day}
                </span>
                <div className="flex h-14 w-full flex-col justify-end gap-0.5">
                  {windows.length === 0 ? (
                    <div className="h-1 rounded-full bg-muted" />
                  ) : (
                    windows.slice(0, 3).map((w) => (
                      <div
                        key={w.id}
                        className="w-full rounded-full bg-primary/80"
                        style={{
                          height: `${Math.max(6, Math.round(((w.endMinute - w.startMinute) / maxLength) * 26))}px`,
                        }}
                        title={`${clock(w.startMinute)}–${clock(w.endMinute)}`}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="size-3.5" />
          {timezone || 'Your timezone'}
        </div>
      </div>
    </Stage>
  );
}

function AccountScene({
  signedIn,
  name,
  email,
  password,
}: {
  signedIn: boolean;
  name: string;
  email: string;
  password: string;
}) {
  const checks = [password.length >= 10, /[A-Z]/.test(password), /\d/.test(password)];
  const strength = checks.filter(Boolean).length;

  if (signedIn) {
    return (
      <Stage className="p-5">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card/60 py-7 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <p className="font-display text-xl font-bold text-headline">Signed in</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {email || 'your account'} — this application attaches to your existing mojo account.
            </p>
          </div>
          <Badge variant="primary" className="gap-1">
            <Check className="size-3" />
            No extra sign-up needed
          </Badge>
        </div>
      </Stage>
    );
  }

  return (
    <Stage className="p-5">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card/60 py-7 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <Lock className="size-6" />
        </span>
        <div className="w-full max-w-xs">
          {name.trim() || email.trim() ? (
            <>
              {name.trim() && (
                <div className="mx-auto flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-headline">
                  <BadgeCheck className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{name.trim()}</span>
                </div>
              )}
              {email.trim() && (
                <div className="mx-auto mt-2 flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-headline">
                  <Mail className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{email.trim()}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Your name and email will appear here as you type.
            </p>
          )}
        </div>
        {password && (
          <div className="w-full max-w-xs">
            <div className="flex gap-1">
              {checks.map((ok, i) => (
                <span
                  key={['len', 'capital', 'number'][i] ?? i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    ok ? 'bg-primary' : 'bg-muted',
                  )}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {strength === 3
                ? 'Strong password.'
                : `${strength}/3 requirements met (10 chars, a capital, a number).`}
            </p>
          </div>
        )}
      </div>
    </Stage>
  );
}

function ReviewRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

function ReviewScene({
  signedIn,
  subjects,
  languages,
  bio,
  displayName,
  photoUrl,
  education,
  yearsExperience,
  certifications,
  introVideoUrl,
  timezone,
  availability,
  name,
  email,
}: Omit<WizardArtworkProps, 'step' | 'subjectOptions' | 'password'>) {
  return (
    <Stage className="p-4">
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 px-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          <ListChecks className="size-3.5 text-primary" />
          Everything below is what you submit
        </p>
        <ReviewRow icon={<BadgeCheck className="size-4" />} label="Profile">
          <div className="flex items-center gap-2.5">
            <Avatar
              name={displayName.trim() || 'New tutor'}
              src={photoUrl || undefined}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-headline">
                {displayName.trim() || 'Your name'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {education.trim() || 'No education added'}
              </p>
            </div>
          </div>
        </ReviewRow>
        <ReviewRow icon={<BookOpen className="size-4" />} label="Subjects">
          {subjects.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {subjects.slice(0, 3).map((subject) => (
                <Badge key={subject} variant="muted">
                  {subject}
                </Badge>
              ))}
              {subjects.length > 3 && <Badge variant="muted">+{subjects.length - 3} more</Badge>}
            </div>
          ) : (
            'None selected'
          )}
        </ReviewRow>
        <ReviewRow icon={<Globe className="size-4" />} label="Languages">
          {languages.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {languages.slice(0, 3).map((language) => (
                <Badge key={language} variant="muted">
                  {language}
                </Badge>
              ))}
              {languages.length > 3 && <Badge variant="muted">+{languages.length - 3} more</Badge>}
            </span>
          ) : (
            'None selected'
          )}
        </ReviewRow>
        <ReviewRow icon={<Trophy className="size-4" />} label="Experience">
          <span className="font-medium text-headline">{yearsExperience ?? 'Not added'}</span>
          {certifications.length > 0 && (
            <span className="text-muted-foreground">
              {' '}
              · {plural(certifications.length, 'credential')}
            </span>
          )}
        </ReviewRow>
        <ReviewRow icon={<MonitorPlay className="size-4" />} label="Intro video">
          {introVideoUrl.trim()
            ? 'Added — students can watch it before booking.'
            : 'Not added (still totally fine)'}
        </ReviewRow>
        <ReviewRow icon={<CalendarDays className="size-4" />} label="Availability">
          <span className="flex flex-wrap items-center gap-x-1 font-medium text-headline">
            {availability.length > 0
              ? availability
                  .slice(0, 2)
                  .map(
                    (w) =>
                      `${WEEKDAY_LETTERS[w.weekday]} ${clock(w.startMinute)}–${clock(w.endMinute)}`,
                  )
                  .join(' · ')
              : 'No weekly windows yet'}
            <span className="text-muted-foreground">
              <Globe className="mx-0.5 -mt-0.5 inline size-3.5" />
              {timezone}
            </span>
          </span>
        </ReviewRow>
        {!signedIn && (
          <ReviewRow icon={<Mail className="size-4" />} label="Your account">
            {name.trim() || email.trim() ? (
              <span className="font-medium text-headline">
                {name.trim() || 'Your name'}
                {name.trim() && email.trim() ? ' · ' : ''}
                {email.trim() || 'your email'}
              </span>
            ) : (
              'Name & email for tutor-review updates'
            )}
          </ReviewRow>
        )}
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your intro
          </p>
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-foreground">
            {bio.trim() ||
              'Write a few friendly sentences about your teaching style while you complete the form.'}
          </p>
        </div>
      </div>
    </Stage>
  );
}

export function WizardArtwork(props: WizardArtworkProps) {
  const { step, signedIn, subjectOptions, subjects, bio, timezone, availability } = props;
  const clawedStep = Math.min(Math.max(step, 0), STEP_META.length - 1);
  const meta = STEP_META[clawedStep] ??
    STEP_META[0] ?? { kicker: '', title: '', caption: () => '' };

  let scene: ReactNode;
  let caption: ReactNode;

  switch (step) {
    case 0:
      scene = (
        <SubjectsScene options={subjectOptions} selected={subjects} languages={props.languages} />
      );
      caption = meta.caption(subjects.length, subjectOptions.length);
      break;
    case 1:
      scene = <BioScene bio={bio} />;
      caption = meta.caption(bio.trim().length);
      break;
    case 2:
      scene = (
        <ProfileScene
          displayName={props.displayName}
          photoUrl={props.photoUrl}
          education={props.education}
          subjects={subjects}
        />
      );
      caption = meta.caption();
      break;
    case 3:
      scene = (
        <ExperienceScene
          yearsExperience={props.yearsExperience}
          certifications={props.certifications}
        />
      );
      caption = meta.caption(props.certifications.length);
      break;
    case 4:
      scene = <VideoScene introVideoUrl={props.introVideoUrl} />;
      caption = meta.caption();
      break;
    case 5: {
      scene = <AvailabilityScene availability={availability} timezone={timezone} />;
      const totalHours =
        availability.reduce((sum, w) => sum + Math.max(0, w.endMinute - w.startMinute), 0) / 60;
      caption = meta.caption(availability.length, totalHours);
      break;
    }
    case 6:
      scene = (
        <AccountScene
          signedIn={signedIn}
          name={props.name}
          email={props.email}
          password={props.password}
        />
      );
      caption = meta.caption(props.name.trim().length + props.email.trim().length);
      break;
    default:
      scene = <ReviewScene {...props} />;
      caption = meta.caption();
      break;
  }

  return (
    <ArtworkFrame step={step} kicker={meta.kicker} title={meta.title} caption={caption}>
      {scene}
    </ArtworkFrame>
  );
}
