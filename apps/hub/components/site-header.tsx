'use client';

import { Button, SiteLogo } from '@mojo/shared/ui';
import { cn } from '@mojo/shared/util';
import { Calendar, Compass, LogOut, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { logout } from '../lib/actions';

export type SiteHeaderUser = { email: string; role: 'tutor' | 'student' | 'admin' } | null;

type NavItem = { href: string; label: string; icon: typeof Compass };

const AUTH_NAV: Record<'tutor' | 'student', NavItem[]> = {
  tutor: [
    { href: '/tutor', label: 'Home', icon: Compass },
    { href: '/tutor/availability', label: 'Availability', icon: Calendar },
  ],
  student: [
    { href: '/', label: 'Home', icon: Compass },
    { href: '/tutors', label: 'Find a tutor', icon: Calendar },
  ],
};

const ANON_NAV: NavItem[] = [
  { href: '/', label: 'Learn', icon: Sparkles },
  { href: '/apply', label: 'Become a tutor', icon: Compass },
];

export function SiteHeader({ user }: { user: SiteHeaderUser }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const items =
    (user?.role === 'tutor' || user?.role === 'student') && user ? AUTH_NAV[user.role] : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <SiteLogo />
        <nav className="flex items-center gap-1">
          {(items ?? (!user ? ANON_NAV : [])).map(({ href, label, icon: Icon }) => (
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
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => startTransition(() => void logout())}
              >
                <LogOut className="size-3.5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  Sign in
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
