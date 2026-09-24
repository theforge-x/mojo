'use client';

import { Badge, Button } from '@mojo/shared/ui';
import { cn } from '@mojo/shared/util';
import { BadgeCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { LandingTutor } from '../lib/landing-data';

const AVATAR_TINTS = [
  'bg-[color-mix(in_oklab,var(--primary)_45%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--secondary)_40%,var(--background))]',
  'bg-[color-mix(in_oklab,var(--tertiary)_55%,var(--background))]',
];

function tintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length] ?? AVATAR_TINTS[0] ?? '';
}

function TutorCard({ tutor }: { tutor: LandingTutor }) {
  const bookHref = `/signup?subject=${encodeURIComponent(tutor.subjects[0] ?? '')}`;
  return (
    <article className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <span
          className={`font-display grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-headline ${tintFor(tutor.id)}`}
        >
          {tutor.initials}
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1 truncate font-semibold text-headline">
            {tutor.name}
            <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />
          </h3>
          <p className="truncate text-sm text-muted-foreground">{tutor.subjects.join(' · ')}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{tutor.tagline}</p>
      <div className="mt-auto pt-5">
        <div className="flex items-center gap-1.5">
          <Star className="size-4 fill-tertiary text-tertiary" />
          <span className="text-sm font-semibold text-headline">{tutor.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({tutor.reviewCount} reviews)</span>
          {tutor.badge && (
            <Badge variant="primary" className="ml-auto">
              {tutor.badge}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{tutor.hoursTaught} hours taught</p>
        <Link href={bookHref} className="mt-4 block">
          <Button size="sm" className="w-full">
            Book {tutor.name.split(' ')[0]}
          </Button>
        </Link>
      </div>
    </article>
  );
}

/**
 * Tutor grid with subject filter pills. All rows are real Postgres tutors;
 * guests book through signup (the directory itself needs an account).
 */
export function TutorGrid({ tutors }: { tutors: readonly LandingTutor[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const subjects = useMemo(() => {
    const seen = new Map<string, number>();
    for (const tutor of tutors) {
      for (const subject of tutor.subjects) {
        seen.set(subject, (seen.get(subject) ?? 0) + 1);
      }
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [tutors]);

  const visible =
    filter === null ? tutors : tutors.filter((tutor) => tutor.subjects.includes(filter));

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        <li>
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              filter === null
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:border-primary hover:bg-accent',
            )}
          >
            All tutors
          </button>
        </li>
        {subjects.map(([subject, count]) => (
          <li key={subject}>
            <button
              type="button"
              onClick={() => setFilter(filter === subject ? null : subject)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                filter === subject
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:border-primary hover:bg-accent',
              )}
            >
              {subject} · {count}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>
    </div>
  );
}
