import type { ReactNode } from 'react';
import { formatWhen } from '../lib/format';

export type SessionView = 'list' | 'grid';

export function parseSessionView(value: string | undefined): SessionView {
  return value === 'grid' ? 'grid' : 'list';
}

export type SessionTone = 'amber' | 'teal' | 'muted' | 'rose';

/** Accent for the date tile + header band, derived from session/charge status. */
export function toneForStatus(status: string): SessionTone {
  switch (status) {
    case 'confirmed':
      return 'teal';
    case 'booked':
      return 'amber';
    case 'refunded':
    case 'cancelled':
    case 'no_show':
      return 'rose';
    default:
      return 'muted';
  }
}

const TILE_TONE: Record<SessionTone, string> = {
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200',
  teal: 'bg-primary/15 text-headline dark:bg-primary/20',
  muted: 'bg-muted text-headline',
  rose: 'bg-secondary/15 text-secondary-foreground dark:bg-secondary/25 dark:text-white',
};

const BAND_TONE: Record<SessionTone, string> = {
  amber: 'from-amber-300 via-orange-300 to-rose-300',
  teal: 'from-teal-300 via-emerald-300 to-cyan-300',
  muted:
    'from-slate-300 via-slate-200 to-zinc-300 dark:from-slate-600 dark:via-slate-700 dark:to-zinc-700',
  rose: 'from-rose-300 via-pink-300 to-orange-200',
};

const DISPLAY_LOCALE = 'en-NG';
const DAY_TIMEZONE = 'Africa/Lagos';

function tileParts(startIso: string): { month: string; day: string; weekday: string } {
  const date = new Date(startIso);
  return {
    month: date
      .toLocaleDateString(DISPLAY_LOCALE, { month: 'short', timeZone: DAY_TIMEZONE })
      .replace('.', '')
      .toUpperCase(),
    day: date.toLocaleDateString(DISPLAY_LOCALE, { day: 'numeric', timeZone: DAY_TIMEZONE }),
    weekday: date.toLocaleDateString(DISPLAY_LOCALE, { weekday: 'short', timeZone: DAY_TIMEZONE }),
  };
}

function lagosDateKey(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Today / Tomorrow / weekday label in the display timezone. */
export function dayLabel(startIso: string, nowIso: string = new Date().toISOString()): string {
  const day = lagosDateKey(startIso);
  const today = lagosDateKey(nowIso);
  if (day === today) return 'Today';
  const tomorrow = lagosDateKey(new Date(Date.parse(nowIso) + 24 * 60 * 60 * 1000).toISOString());
  if (day === tomorrow) return 'Tomorrow';
  return new Date(startIso).toLocaleDateString(DISPLAY_LOCALE, {
    weekday: 'long',
    timeZone: DAY_TIMEZONE,
  });
}

export function durationMinutes(startIso: string, endIso: string): number {
  return Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60_000));
}

/** Calendar-style date tile — the session analogue of the tutor photo column. */
export function SessionDateTile({
  startIso,
  tone,
  size = 'md',
}: {
  startIso: string;
  tone: SessionTone;
  size?: 'md' | 'sm';
}) {
  const { month, day, weekday } = tileParts(startIso);
  return (
    <div
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-xl font-display ${TILE_TONE[tone]} ${
        size === 'md' ? 'w-20 py-3' : 'w-16 py-2'
      }`}
    >
      <span
        className={`font-bold tracking-[0.14em] ${size === 'md' ? 'text-[11px]' : 'text-[10px]'}`}
      >
        {month}
      </span>
      <span className={`font-extrabold leading-none ${size === 'md' ? 'text-3xl' : 'text-2xl'}`}>
        {day}
      </span>
      <span className={`text-muted-foreground ${size === 'md' ? 'text-[11px]' : 'text-[10px]'}`}>
        {weekday}
      </span>
    </div>
  );
}

export interface SessionCardProps {
  readonly startIso: string;
  readonly endIso?: string;
  readonly tone: SessionTone;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly badges?: ReactNode;
  /** Right-rail (list) / stacked (grid) actions: buttons, links, forms. */
  readonly actions?: ReactNode;
  /** Full-width extra content: recaps, review/reschedule forms, breakdowns. */
  readonly children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/* Robust list card — mirrors the Preply-style tutor row               */
/* ------------------------------------------------------------------ */

export function SessionListCard({
  startIso,
  endIso,
  tone,
  title,
  subtitle,
  badges,
  actions,
  children,
}: SessionCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-200 hover:shadow-[0_16px_40px_-20px_color-mix(in_oklab,var(--headline)_35%,transparent)]">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3 sm:w-20 sm:shrink-0 sm:flex-col sm:gap-2 sm:py-1 sm:text-center">
          <SessionDateTile startIso={startIso} tone={tone} />
          <span className="text-xs font-semibold text-primary sm:text-center">
            {dayLabel(startIso)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold tracking-tight text-headline">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
          <p className="mt-1.5 text-sm text-foreground/85">
            {endIso ? formatWhen(startIso, endIso) : tileParts(startIso).weekday}
            {endIso && (
              <span className="text-muted-foreground">
                {' '}
                · {durationMinutes(startIso, endIso)} min
              </span>
            )}
          </p>
          {badges && <div className="mt-2.5 flex flex-wrap items-center gap-1.5">{badges}</div>}
          {children && <div className="mt-3">{children}</div>}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 border-t border-border pt-4 sm:w-52 sm:flex-col sm:items-stretch sm:border-l sm:border-t-0 sm:bg-muted/40 sm:p-5 sm:text-center">
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Masonry grid card — uniform header band, content-driven height       */
/* ------------------------------------------------------------------ */

export function SessionGridCard({
  startIso,
  endIso,
  tone,
  title,
  subtitle,
  badges,
  actions,
  children,
}: SessionCardProps) {
  const { month, day, weekday } = tileParts(startIso);
  return (
    <article className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-20px_color-mix(in_oklab,var(--headline)_40%,transparent)]">
      <div className={`relative overflow-hidden bg-gradient-to-br ${BAND_TONE[tone]}`}>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="leading-tight text-slate-900 dark:text-white">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
              {month} · {weekday}
            </p>
            <p className="font-display text-3xl font-extrabold leading-none">{day}</p>
          </div>
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm dark:bg-black/45 dark:text-white">
            {dayLabel(startIso)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="truncate font-display text-[15px] font-bold leading-snug text-headline">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
        <p className="mt-1.5 text-[13px] text-foreground/85">
          {endIso ? formatWhen(startIso, endIso) : weekday}
          {endIso && (
            <span className="text-muted-foreground">
              {' '}
              · {durationMinutes(startIso, endIso)} min
            </span>
          )}
        </p>
        {badges && <div className="mt-2 flex flex-wrap items-center gap-1.5">{badges}</div>}
        {children && <div className="mt-3">{children}</div>}
        {actions && <div className="mt-6 flex flex-col items-stretch gap-2">{actions}</div>}
      </div>
    </article>
  );
}
