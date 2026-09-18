'use client';

import { Button } from '@mojo/shared/ui';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

/**
 * Wiingy-style hero search: typeahead over the real subject catalogue,
 * submit lands on signup carrying the subject intent (guests can't browse
 * the directory until they join — after signup they land filtered).
 */
export function HeroSearch({ subjects }: { subjects: readonly { name: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return subjects.slice(0, 6);
    return subjects.filter((subject) => subject.name.toLowerCase().includes(needle)).slice(0, 6);
  }, [query, subjects]);

  function go(subject: string) {
    const name = subject.trim();
    router.push(name === '' ? '/signup' : `/signup?subject=${encodeURIComponent(name)}`);
  }

  return (
    <div className="relative mx-auto mt-8 max-w-xl">
      <form
        action="/signup"
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          go(suggestions[0]?.name ?? query);
        }}
      >
        <label className="sr-only" htmlFor="hero-subject">
          What do you want to learn?
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="hero-subject"
            name="subject"
            autoComplete="off"
            placeholder="What do you want to learn? Try “Maths”…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (blurTimer.current) clearTimeout(blurTimer.current);
              setFocused(true);
            }}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setFocused(false), 120);
            }}
            className="h-12 w-full rounded-full border border-input bg-background pr-5 pl-11 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
        </div>
        <Button type="submit" size="lg" className="rounded-full px-8">
          Find a tutor
        </Button>
      </form>
      {focused && suggestions.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-popover text-left shadow-lg">
          {suggestions.map((subject) => (
            <li key={subject.name}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => go(subject.name)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <Search className="size-3.5 text-muted-foreground" />
                {subject.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
