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
  Calendar,
  ChevronDown,
  Compass,
  Home,
  LogOut,
  type LucideIcon,
  MessageSquare,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { logout } from '../lib/actions';

export type SiteHeaderUser = {
  name: string;
  email: string;
  role: 'tutor' | 'student' | 'admin';
} | null;

type NavItem = { href: string; label: string; icon: LucideIcon };

const AUTH_NAV: Record<'tutor' | 'student', NavItem[]> = {
  tutor: [{ href: '/tutor/availability', label: 'Availability', icon: Calendar }],
  student: [{ href: '/tutors', label: 'Find a tutor', icon: Calendar }],
};

const ANON_NAV: NavItem[] = [
  { href: '/', label: 'Learn', icon: Sparkles },
  { href: '/apply', label: 'Become a tutor', icon: Compass },
];

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
  const studentOnly = [{ href: '/saved-tutors', label: 'Saved tutors', icon: Bookmark }] as const;
  const tutorOnly = [
    { href: '/tutor/availability', label: 'Availability', icon: Calendar },
  ] as const;
  const tail = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/profile', label: 'Profile', icon: User },
  ] as const;
  return [...common, ...(role === 'student' ? studentOnly : tutorOnly), ...tail];
};

export function SiteHeader({ user }: { user: SiteHeaderUser }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  if (!user) {
    return (
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <SiteLogo />
          <nav className="flex items-center gap-1">
            {ANON_NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-headline',
                    pathname === href && 'bg-muted text-headline',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm" variant="ghost">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>
    );
  }
  const items = user.role === 'tutor' || user.role === 'student' ? AUTH_NAV[user.role] : [];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <SiteLogo />
          {items.length > 0 && (
            <nav className="hidden items-center gap-1 sm:flex">
              {items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <span
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-headline',
                      pathname === href && 'bg-muted text-headline',
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </span>
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
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
