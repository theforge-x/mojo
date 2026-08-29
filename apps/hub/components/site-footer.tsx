import { Button, Input, MojoMark } from '@mojo/shared/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SiteHeaderUser } from './site-header';

/** Brand glyphs mirror apps/hub/public/*.svg (stroke uses `currentColor`). */
function SocialGlyph({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const SVG_PATHS: Record<string, ReactNode> = {
  Instagram: (
    <>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </>
  ),
  'X (Twitter)': (
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  ),
  YouTube: (
    <>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </>
  ),
  Facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  LinkedIn: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  GitHub: (
    <>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </>
  ),
};

const SOCIALS = Object.keys(SVG_PATHS);

const LINK_COLUMNS = [
  {
    heading: 'Learn',
    links: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Find a tutor', href: '/tutors' },
      { label: 'What we teach', href: '/#why-mojo' },
    ],
  },
  {
    heading: 'For tutors',
    links: [
      { label: 'Become a tutor', href: '/apply' },
      { label: 'Availability', href: '/tutor/availability' },
      { label: 'Earnings', href: '/' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About mojo', href: '/' },
      { label: 'Contact us', href: 'mailto:hello@mojo.dev' },
      { label: 'Privacy', href: '/' },
      { label: 'Terms', href: '/' },
    ],
  },
];

export function SiteFooter({ user }: { user: SiteHeaderUser }) {
  if (!user) {
    return (
      <footer className="border-t border-border bg-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <MojoMark className="size-6" />
              <span className="font-display text-lg font-semibold text-headline">
                mojo<span className="text-secondary">.</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Learn live. Tutoring for real life — connect with vetted tutors for 1-on-1 lessons
              that actually move the needle.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((label) => (
                <button
                  type="button"
                  key={label}
                  aria-label={label}
                  title={label}
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <SocialGlyph>{SVG_PATHS[label]}</SocialGlyph>
                </button>
              ))}
            </div>
          </div>

          {LINK_COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-headline">
                {heading}
              </h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-headline">
              Stay in the loop
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              New subjects, tutor highlights and learning tips, once in a while.
            </p>
            <form className="mt-4 flex gap-2">
              <Input type="email" placeholder="you@email.com" aria-label="Email address" />
              <Button type="submit" size="sm">
                Join
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} mojo · Made in Lagos
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">Tutoring for real life.</span>
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 sm:flex-row">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MojoMark className="size-5" />
          <span className="font-display text-sm font-semibold text-headline">
            mojo<span className="text-secondary">.</span>
          </span>
          <span className="text-xs">Learn live. Tutoring for real life.</span>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} mojo · Made in Lagos
        </p>
      </div>
    </footer>
  );
}
