import type { TutorLevel } from '@mojo/shared/domain';
import { Avatar, Badge, Button } from '@mojo/shared/ui';
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  GraduationCap,
  Languages,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { formatMinor } from '../lib/format';

export interface EnrichedTutor {
  readonly tutorId: string;
  readonly displayName: string;
  readonly photoUrl: string;
  readonly education: string;
  readonly timezone: string;
  readonly level: TutorLevel;
  readonly perSegmentMinor: number;
  readonly rating: number;
  readonly responseTimeMinutesAvg: number;
  readonly subjects: readonly string[];
  readonly languages: readonly string[];
  readonly bio: string;
  readonly lessonsTaught: number;
  readonly reviewCount: number;
  /** True when the tutor's weekly availability covers right now (not paused, not blocked). */
  readonly isAvailableNow: boolean;
  readonly introVideoUrl: string;
}

const FALLBACK_TINTS = [
  'from-teal-400 via-emerald-500 to-cyan-600',
  'from-rose-400 via-pink-500 to-orange-400',
  'from-violet-400 via-purple-500 to-indigo-600',
  'from-amber-300 via-orange-400 to-rose-500',
  'from-sky-400 via-blue-500 to-indigo-600',
  'from-lime-300 via-emerald-400 to-teal-600',
];

const MASONRY_RATIOS = [
  'aspect-[3/4]',
  'aspect-[4/5]',
  'aspect-square',
  'aspect-[3/4]',
  'aspect-[9/13]',
  'aspect-[4/5]',
];

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '•'
  );
}

function tintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (
    FALLBACK_TINTS[hash % FALLBACK_TINTS.length] ??
    FALLBACK_TINTS[0] ??
    'from-teal-400 via-emerald-500 to-cyan-600'
  );
}

function levelMeta(level: TutorLevel): { label: string; pill: string } {
  switch (level) {
    case 'expert':
      return {
        label: 'Super Tutor',
        pill: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300',
      };
    case 'established':
      return {
        label: 'Popular Tutor',
        pill: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-300',
      };
    default:
      return {
        label: 'New Tutor',
        pill: 'bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-300',
      };
  }
}

function formatResponse(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return 'Responds quickly';
  if (minutes < 60) return `Responds in ~${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `Responds in ~${hours < 2 ? 1 : Math.round(hours)} hr`;
  return `Responds in ~${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? '' : 's'}`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={
            i < Math.round(rating)
              ? 'size-3.5 fill-amber-400 text-amber-400'
              : 'size-3.5 text-muted-foreground/40'
          }
        />
      ))}
    </span>
  );
}

function TutorPhoto({
  tutor,
  className,
  rounded = 'rounded-none',
  eager = false,
}: {
  tutor: EnrichedTutor;
  className?: string;
  rounded?: string;
  eager?: boolean;
}) {
  if (tutor.photoUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: tutor photos are remote/demo URLs
      <img
        src={tutor.photoUrl}
        alt={`${tutor.displayName}, tutor`}
        loading={eager ? 'eager' : 'lazy'}
        className={`h-full w-full object-cover ${rounded} ${className ?? ''}`}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`grid h-full w-full place-items-center bg-gradient-to-br ${tintFor(tutor.tutorId)} ${rounded} ${className ?? ''}`}
    >
      <div className="flex flex-col items-center gap-1 px-4 text-center">
        <span className="font-display text-5xl font-bold tracking-tight text-white drop-shadow-sm">
          {initialsOf(tutor.displayName)}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
          {tutor.subjects[0] ?? 'Tutor'}
        </span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px),radial-gradient(circle_at_80%_30%,white_1px,transparent_1px),radial-gradient(circle_at_40%_80%,white_1px,transparent_1px)] [background-size:28px_28px]"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preply-style list card                                              */
/* ------------------------------------------------------------------ */

export function TutorListCard({ tutor }: { tutor: EnrichedTutor }) {
  const level = levelMeta(tutor.level);
  const detailHref = `/tutors/${tutor.tutorId}`;
  const messageHref = `/messages?with=${encodeURIComponent(tutor.tutorId)}`;
  const responsive = tutor.responseTimeMinutesAvg > 0 && tutor.responseTimeMinutesAvg <= 60;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-200 hover:shadow-[0_16px_40px_-20px_color-mix(in_oklab,var(--headline)_35%,transparent)]">
      <div className="flex flex-col sm:flex-row">
        {/* Photo column — Preply's large left portrait */}
        <Link
          href={detailHref}
          className="relative block w-full shrink-0 overflow-hidden sm:w-48 lg:w-56"
          aria-label={`View ${tutor.displayName}'s profile`}
        >
          <div className="relative aspect-[16/10] w-full sm:aspect-auto sm:h-full sm:min-h-[268px]">
            <TutorPhoto tutor={tutor} eager={false} />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
            <span
              className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${level.pill}`}
            >
              <Trophy className="size-3" aria-hidden />
              {level.label}
            </span>
            {tutor.isAvailableNow && (
              <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                Available now
              </span>
            )}
            {tutor.introVideoUrl && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                <Play className="size-3 fill-white" aria-hidden />
                Intro video
              </span>
            )}
          </div>
        </Link>

        {/* Middle column — identity, stats, bio */}
        <div className="min-w-0 flex-1 p-5 sm:py-5 sm:pl-5 sm:pr-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={detailHref} className="hover:underline">
                <h3 className="flex items-center gap-1.5 font-display text-xl font-bold tracking-tight text-headline">
                  <span className="truncate">{tutor.displayName}</span>
                  <BadgeCheck
                    className="size-5 shrink-0 text-primary"
                    aria-label="Verified tutor"
                  />
                </h3>
              </Link>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
                <GraduationCap className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{tutor.education || 'Verified community tutor'}</span>
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            <Stars rating={tutor.rating} />
            <span className="font-bold text-headline">
              {tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'}
            </span>
            {tutor.reviewCount > 0 && (
              <span className="text-muted-foreground underline decoration-dotted underline-offset-2">
                {tutor.reviewCount} review{tutor.reviewCount === 1 ? '' : 's'}
              </span>
            )}
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
            <span className="font-medium text-muted-foreground">
              {tutor.lessonsTaught > 0
                ? `${tutor.lessonsTaught} lesson${tutor.lessonsTaught === 1 ? '' : 's'} taught`
                : 'Ready for first lessons'}
            </span>
          </div>

          <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Languages className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                Speaks {tutor.languages.length > 0 ? tutor.languages.join(', ') : 'English'}
              </span>
            </span>
            {tutor.subjects.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5 shrink-0" aria-hidden />
                Teaches {tutor.subjects.slice(0, 3).join(', ')}
                {tutor.subjects.length > 3 && ` +${tutor.subjects.length - 3}`}
              </span>
            )}
          </p>

          {tutor.bio && (
            <p className="mt-2.5 line-clamp-2 max-w-prose text-sm leading-relaxed text-foreground/85">
              {tutor.bio}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(tutor.subjects.length > 0 ? tutor.subjects : ['General']).slice(0, 5).map((s) => (
              <Link
                key={s}
                href={`/tutors?subject=${encodeURIComponent(s)}`}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-headline"
              >
                {s}
              </Link>
            ))}
            <Badge variant="muted" className="capitalize">
              {tutor.level}
            </Badge>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
            <Clock3 className="size-3.5" aria-hidden />
            {formatResponse(tutor.responseTimeMinutesAvg)}
          </p>
        </div>

        {/* Right rail — Preply's booking column */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-border bg-muted/40 p-5 sm:w-52 sm:flex-col sm:items-stretch sm:justify-center sm:border-l sm:border-t-0 sm:text-center">
          <div className="sm:mx-auto">
            <p className="font-display text-2xl font-bold tracking-tight text-headline">
              {formatMinor(tutor.perSegmentMinor)}
            </p>
            <p className="text-xs text-muted-foreground">per 15-min lesson</p>
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-headline">
              <Zap className="size-3" aria-hidden />
              Trial available
            </p>
          </div>
          <div className="flex w-full max-w-44 flex-col gap-2 sm:mx-auto sm:max-w-none">
            <Button asChild className="w-full rounded-xl">
              <Link href={detailHref}>Book trial</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link href={messageHref}>
                <MessageCircle className="size-4" aria-hidden />
                Message
              </Link>
            </Button>
            <p className="hidden items-center justify-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
              <Clock3 className="size-3" aria-hidden />
              {formatResponse(tutor.responseTimeMinutesAvg)}
              {responsive && ' · fast'}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Pinterest-style masonry card                                        */
/* ------------------------------------------------------------------ */

export function TutorMasonryCard({ tutor, index = 0 }: { tutor: EnrichedTutor; index?: number }) {
  const detailHref = `/tutors/${tutor.tutorId}`;
  const messageHref = `/messages?with=${encodeURIComponent(tutor.tutorId)}`;
  // Uniform tile when there is no uploaded photo: the gradient placeholder
  // carries no real image variation, so height differences between cards come
  // from actual content (bio, subjects, meta) instead of fake ratios. Real
  // photos keep their varied Pinterest-style ratios.
  const ratio = tutor.photoUrl
    ? (MASONRY_RATIOS[index % MASONRY_RATIOS.length] ?? 'aspect-[3/4]')
    : 'aspect-[4/3]';
  const level = levelMeta(tutor.level);

  return (
    <article className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-20px_color-mix(in_oklab,var(--headline)_40%,transparent)]">
      <div className={`relative overflow-hidden ${ratio}`}>
        <Link href={detailHref} aria-label={`View ${tutor.displayName}'s profile`}>
          <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]">
            <TutorPhoto tutor={tutor} rounded="rounded-none" />
          </div>
        </Link>

        {/* Pinterest-style hover overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${level.pill}`}
        >
          {level.label}
        </span>

        {/* Pinterest red "Save" affordance */}
        <div className="absolute right-3 top-3 flex translate-y-1 gap-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="pointer-events-auto rounded-full px-4 font-bold shadow-md"
          >
            <Link href={detailHref}>Save</Link>
          </Button>
        </div>

        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm">
              {formatMinor(tutor.perSegmentMinor)}
              <span className="font-medium text-slate-500"> /lesson</span>
            </span>
            {tutor.introVideoUrl && (
              <span
                className="grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
                title="Has an intro video"
              >
                <Play className="size-3 fill-white" aria-hidden />
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
            {tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'}
          </span>
        </div>
      </div>

      <div className="p-3.5">
        <Link href={detailHref} className="hover:underline">
          <h3 className="flex items-center gap-1 font-display text-[15px] font-bold leading-snug text-headline">
            <span className="truncate">{tutor.displayName}</span>
            <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified tutor" />
          </h3>
        </Link>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Stars rating={tutor.rating} />
          <span className="font-semibold text-headline">
            {tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'}
          </span>
          {tutor.reviewCount > 0 && <span>({tutor.reviewCount})</span>}
          <span aria-hidden>·</span>
          <span>
            {tutor.lessonsTaught > 0 ? `${tutor.lessonsTaught} lessons` : 'First lessons'}
          </span>
        </p>

        {tutor.bio && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-foreground/80">
            {tutor.bio}
          </p>
        )}

        {tutor.subjects.length > 0 && (
          <p className="mt-1.5 truncate text-xs font-medium text-primary">
            {tutor.subjects
              .slice(0, 3)
              .map((s) => `#${s.replace(/\s+/g, '')}`)
              .join('  ')}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-2">
          <Avatar name={tutor.displayName} src={tutor.photoUrl || undefined} size="sm" />
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {tutor.education || tutor.languages.join(' · ') || 'Community tutor'}
          </p>
          <span className="flex shrink-0 items-center gap-1">
            <Link
              href={detailHref}
              aria-label={`Book ${tutor.displayName}`}
              className="grid size-8 place-items-center rounded-full bg-muted text-headline transition-colors hover:bg-primary"
            >
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <Link
              href={messageHref}
              aria-label={`Message ${tutor.displayName}`}
              className="grid size-8 place-items-center rounded-full bg-muted text-headline transition-colors hover:bg-primary"
            >
              <MessageCircle className="size-4" aria-hidden />
            </Link>
          </span>
        </div>
      </div>
    </article>
  );
}
