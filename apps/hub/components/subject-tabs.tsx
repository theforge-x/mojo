'use client';

import { cn } from '@mojo/shared/util';
import { BookOpen, Briefcase, Code2, FlaskConical, GraduationCap, Languages, Music, Palette } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { LandingDomain } from '../lib/landing-data';

function domainIcon(name: string) {
  const lower = name.toLowerCase();
  if (/(language)/.test(lower)) return Languages;
  if (/(music)/.test(lower)) return Music;
  if (/(academic|math|science)/.test(lower)) return GraduationCap;
  if (/(tech|business)/.test(lower)) return Code2;
  return BookOpen;
}

function subjectIcon(name: string) {
  const lower = name.toLowerCase();
  if (/(spanish|french|english|yoruba|igbo|hausa|language)/.test(lower)) return Languages;
  if (/(physics|chemistry|biology|science)/.test(lower)) return FlaskConical;
  if (/(piano|guitar|music)/.test(lower)) return Music;
  if (/(python|coding|robotics|tech)/.test(lower)) return Code2;
  if (/(business|economics)/.test(lower)) return Briefcase;
  if (/(art|design)/.test(lower)) return Palette;
  return GraduationCap;
}

export interface DomainTab {
  readonly id: string;
  readonly name: string;
}

/**
 * Preply-style domain tab row. Selecting a tab shows that domain's subjects
 * alone; the subject lists below it re-render from the active domain.
 */
export function DomainTabRow<T extends DomainTab>({
  domains,
  activeId,
  onSelect,
  allowAll = false,
}: {
  domains: readonly T[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  allowAll?: boolean;
}) {
  return (
    <ul className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Subject domains">
      {allowAll && (
        <li role="presentation">
          <button
            type="button"
            role="tab"
            aria-selected={activeId === null}
            onClick={() => onSelect(null)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              activeId === null
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:border-primary hover:bg-accent',
            )}
          >
            All
          </button>
        </li>
      )}
      {domains.map((domain) => {
        const Icon = domainIcon(domain.name);
        const active = activeId === domain.id;
        return (
          <li key={domain.id} role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(active ? (allowAll ? null : domain.id) : domain.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:border-primary hover:bg-accent',
              )}
            >
              <Icon className="size-3.5" /> {domain.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Hero subject browser: domain tabs on top, that domain's subjects as chips. */
export function SubjectExplorer({ domains }: { domains: readonly LandingDomain[] }) {
  const [activeId, setActiveId] = useState<string | null>(domains[0]?.id ?? null);
  const active = domains.find((domain) => domain.id === activeId) ?? domains[0];
  if (!active) return null;
  return (
    <div className="mt-6">
      <DomainTabRow domains={domains} activeId={active.id} onSelect={(id) => setActiveId(id)} />
      <ul className="mt-4 flex flex-wrap justify-center gap-2">
        {active.subjects.map((subject) => {
          const Icon = subjectIcon(subject.name);
          return (
            <li key={subject.name}>
              <Link
                href={`/signup?subject=${encodeURIComponent(subject.name)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
              >
                <Icon className="size-3.5" /> {subject.name}
                <span className="text-xs text-muted-foreground">· {subject.tutorCount}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
