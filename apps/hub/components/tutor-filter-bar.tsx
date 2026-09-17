'use client';

import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@mojo/shared/ui';
import { LayoutGrid, Rows3 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface SubjectGroup {
  readonly domain: string;
  readonly subjects: readonly string[];
}

const LANGUAGE_OPTIONS = ['English', 'French', 'Spanish', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin'];

const LEVEL_OPTIONS = [
  { value: 'entry', label: 'Entry' },
  { value: 'established', label: 'Established' },
  { value: 'expert', label: 'Expert' },
];

const MIN_RATING_OPTIONS = ['4.0', '4.5', '5.0'];

const HORIZON_OPTIONS = [
  { value: '2', label: 'Next 2 hours' },
  { value: '24', label: 'This day' },
  { value: '48', label: 'Next 2 days' },
  { value: '72', label: 'Next 3 days' },
];

const CLEAR = '__all__';

export type TutorDirectoryView = 'list' | 'grid';

export function TutorFilterBar({
  subject,
  level,
  language,
  minRating,
  availableWithinHours,
  view,
  subjectGroups,
}: {
  subject: string;
  level: string;
  language: string;
  minRating: string;
  availableWithinHours: string;
  view: TutorDirectoryView;
  subjectGroups: readonly SubjectGroup[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = pathname || '/tutors';

  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === CLEAR) params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  function applyView(next: TutorDirectoryView) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'list') params.delete('view');
    else params.set('view', next);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    const currentView = params.get('view');
    const next = new URLSearchParams();
    if (currentView === 'grid') next.set('view', 'grid');
    const query = next.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={subject || CLEAR} onValueChange={(value) => apply('subject', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={CLEAR}>Any subject</SelectItem>
            </SelectGroup>
            {subjectGroups.map((group) => (
              <SelectGroup key={group.domain}>
                <SelectLabel>{group.domain}</SelectLabel>
                {group.subjects.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <Select value={language || CLEAR} onValueChange={(value) => apply('language', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={CLEAR}>Any language</SelectItem>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={level || CLEAR} onValueChange={(value) => apply('level', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={CLEAR}>Any level</SelectItem>
              {LEVEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={minRating || CLEAR} onValueChange={(value) => apply('minRating', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Min rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={CLEAR}>Any rating</SelectItem>
              {MIN_RATING_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}★+
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={availableWithinHours || CLEAR}
          onValueChange={(value) => apply('availableWithinHours', value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Available within" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={CLEAR}>Anytime</SelectItem>
              {HORIZON_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {[subject, level, language, minRating, availableWithinHours].some(Boolean) && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear filters
          </Button>
        )}

        <fieldset className="ms-auto flex items-center gap-1 rounded-lg bg-muted p-1">
          <legend className="sr-only">Change tutor list layout</legend>
          <Button
            type="button"
            variant={view === 'list' ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={view === 'list'}
            aria-label="List view"
            title="List view — detailed rows"
            onClick={() => applyView('list')}
            className="gap-1.5"
          >
            <Rows3 className="size-4" aria-hidden />
            <span className="hidden sm:inline">List</span>
          </Button>
          <Button
            type="button"
            variant={view === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={view === 'grid'}
            aria-label="Grid view"
            title="Masonry grid view"
            onClick={() => applyView('grid')}
            className="gap-1.5"
          >
            <LayoutGrid className="size-4" aria-hidden />
            <span className="hidden sm:inline">Grid</span>
          </Button>
        </fieldset>
      </div>
    </div>
  );
}
