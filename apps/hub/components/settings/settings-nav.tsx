'use client';

import { useEffect, useState } from 'react';
import type { SettingsSectionDef } from './settings-section';

/**
 * Fixed-on-scroll settings sidebar. Anchor links work without JS; the
 * scroll-spy highlight is progressive enhancement on top.
 */
export function SettingsNav({ items }: { items: readonly SettingsSectionDef[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Settings sections" className="rounded-xl border border-border bg-card p-2">
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? 'true' : undefined}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                active === item.id
                  ? 'bg-muted font-semibold text-headline'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-headline'
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
