'use client';

import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SiteLogo,
  ThemeToggle,
} from '@mojo/shared/ui';
import { cn } from '@mojo/shared/util';
import {
  Bookmark,
  BookOpen,
  Calendar,
  ChevronDown,
  Compass,
  CreditCard,
  Home,
  LogOut,
  type LucideIcon,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState, useTransition } from 'react';
import { logout } from '../lib/actions';

export type SiteHeaderUser = {
  name: string;
  email: string;
  role: 'tutor' | 'student' | 'admin';
} | null;

export interface HeaderSubject {
  readonly name: string;
  readonly tutorCount: number;
}

type NavItem = { href: string; label: string; icon: LucideIcon };

const AUTH_NAV: Record<'tutor' | 'student', NavItem[]> = {
  tutor: [{ href: '/tutor/availability', label: 'Availability', icon: Calendar }],
  student: [
    { href: '/tutors', label: 'Find a tutor', icon: Calendar },
    { href: '/payments', label: 'Payments', icon: CreditCard },
  ],
};

const ANON_NAV: NavItem[] = [
  { href: '/', label: 'Learn', icon: Sparkles },
  { href: '/apply', label: 'Become a tutor', icon: Compass },
];

function NavLink({ href, label, icon: Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link href={href}>
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-headline',
          active && 'bg-muted text-headline',
        )}
      >
        <Icon className="size-4" />
        {label}
      </span>
    </Link>
  );
}

/**
 * Hover dropdown for the center nav (desktop). CSS-only: opens on
 * hover AND keyboard focus, closes on blur — no JS state to desync.
 */
function NavDropdown({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-headline"
      >
        <Icon className="size-4" />
        {label}
        <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute top-full left-1/2 z-50 -translate-x-1/2 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

function SubjectsMenu({ subjects }: { subjects: readonly HeaderSubject[] }) {
  return (
    <NavDropdown label="Subjects" icon={BookOpen}>
      {subjects.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">
          Subjects appear here as tutors join.
        </p>
      ) : (
        <ul className="max-h-80 overflow-y-auto p-2">
          {subjects.map((subject) => (
            <li key={subject.name}>
              <Link
                href={`/signup?subject=${encodeURIComponent(subject.name)}`}
                className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {subject.name}
                <span className="text-xs text-muted-foreground">
                  {subject.tutorCount} tutor{subject.tutorCount === 1 ? '' : 's'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-border p-2">
        <Link
          href="/signup"
          className="block rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
        >
          Browse all subjects
        </Link>
      </div>
    </NavDropdown>
  );
}

const profileItems = (
  role: 'tutor' | 'student',
): { href: string; label: string; icon: LucideIcon }[] => {
  const common = [
    {
      href: role === 'tutor' ? '/tutor' : '/',
      label: 'Home',
      icon: Home,
    },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ] as const;
  const studentOnly = [
    { href: '/saved-tutors', label: 'Saved tutors', icon: Bookmark },
    { href: '/payments', label: 'Payments', icon: CreditCard },
  ] as const;
  const tutorOnly = [
    { href: '/tutor/availability', label: 'Availability', icon: Calendar },
    { href: '/tutor/outreach', label: 'Outreach', icon: Sparkles },
  ] as const;
  const tail = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/profile', label: 'Profile', icon: User },
  ] as const;
  return [...common, ...(role === 'student' ? studentOnly : tutorOnly), ...tail];
};

/**
 * Three-zone grid: `1fr auto 1fr` keeps the middle nav optically centered
 * against the viewport no matter how wide the logo or action clusters are
 * (plain space-between would drift toward the heavier side).
 */
export function SiteHeader({
  user,
  subjects = [],
}: {
  user: SiteHeaderUser;
  subjects?: readonly HeaderSubject[];
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // The chrome stays invisible over the hero and fades in once it scrolls
  // out of view; pages without a hero go solid almost immediately.
  useEffect(() => {
    function onScroll() {
      const hero = document.getElementById('hero');
      const limit = hero ? hero.offsetTop + hero.offsetHeight - 96 : 24;
      setScrolled(window.scrollY > limit);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const chrome = scrolled
    ? 'border-b border-border bg-background/95 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur'
    : 'border-b border-transparent bg-transparent';

  if (!user) {
    return (
      <header
        className={`sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ${chrome}`}
      >
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="justify-self-start">
            <SiteLogo />
          </div>
          <nav
            className="hidden items-center gap-1 justify-self-center md:flex"
            aria-label="Primary"
          >
            <SubjectsMenu subjects={subjects} />
            <NavDropdown label="Tutors" icon={Sparkles}>
              <div className="p-2">
                <Link
                  href="/#tutors"
                  className="block rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  Our tutors
                </Link>
                <Link
                  href="/apply"
                  className="block rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  Become a tutor
                </Link>
              </div>
            </NavDropdown>
          </nav>
          <div className="flex items-center gap-2 justify-self-end">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:inline">
              <Button size="sm" variant="ghost">
                Sign in
              </Button>
            </Link>
            <Link href="/signup" className="hidden sm:inline">
              <Button size="sm">Get started</Button>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-headline md:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden"
            aria-label="Mobile"
          >
            {ANON_NAV.map((item) => (
              <Button key={item.href} type="button" onClick={() => setMenuOpen(false)}>
                <NavLink {...item} active={pathname === item.href} />
              </Button>
            ))}
            {subjects.length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Subjects
                </p>
                <div className="flex flex-wrap gap-2 px-1 pb-1">
                  {subjects.slice(0, 8).map((subject) => (
                    <Link
                      key={subject.name}
                      href={`/signup?subject=${encodeURIComponent(subject.name)}`}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-full border border-border px-3 py-1 text-sm"
                    >
                      {subject.name}
                    </Link>
                  ))}
                </div>
              </>
            )}
            <div className="flex gap-2 px-1 pt-3 sm:hidden">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1">
                <Button size="sm" variant="outline" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex-1">
                <Button size="sm" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </header>
    );
  }
  const items = user.role === 'tutor' || user.role === 'student' ? AUTH_NAV[user.role] : [];

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ${chrome}`}
    >
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="justify-self-start">
          <SiteLogo />
        </div>

        {items.length > 0 && (
          <nav
            className="hidden items-center gap-1 justify-self-center sm:flex"
            aria-label="Primary"
          >
            {items.map((item) => (
              <NavLink key={item.href} {...item} active={pathname === item.href} />
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 justify-self-end">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-full p-2 text-headline"
              >
                <span aria-hidden className="inline-flex size-6 items-center justify-center">
                  <Avatar
                    name={user.name || user.email}
                    size="sm"
                    className="[&>span]:text-xs [&>span]:font-bold [&>span]:text-primary"
                  />
                </span>
                <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                  {user.name || user.email}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block truncate text-sm font-semibold text-headline">
                  {user.name}
                </span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profileItems(user.role === 'tutor' ? 'tutor' : 'student').map(
                ({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={label} asChild>
                    <Link href={href} className="gap-2">
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  </DropdownMenuItem>
                ),
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={pending}
                onSelect={(event) => {
                  event.preventDefault();
                  startTransition(() => void logout());
                }}
                variant="destructive"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
