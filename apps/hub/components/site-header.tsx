'use client';

import { Button, SiteLogo } from '@mojo/shared/ui';
import { cn } from '@mojo/shared/util';
import { Calendar, Compass } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type SiteHeaderUser = { email: string; role: 'tutor' | 'student' | 'admin' } | null;

const NAV: Record<'tutor' | 'student', { href: string; label: string; icon: typeof Compass }[]> = {
  tutor: [
    { href: '/tutor/home', label: 'Home', icon: Compass },
    { href: '/tutor/availability', label: 'Availability', icon: Calendar },
  ],
  student: [
    { href: '/student/home', label: 'Home', icon: Compass },
    { href: '/student/tutors', label: 'Find a tutor', icon: Calendar },
  ],
};

export function SiteHeader({ user }: { user: SiteHeaderUser }) {
  const pathname = usePathname();
  const items = user && user.role !== 'admin' ? NAV[user.role] : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <SiteLogo />
        {items && (
          <nav className="flex items-center gap-1">
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
        <div className="flex items-center gap-3">
          {user ? (
            <span className="text-xs text-muted-foreground">{user.email}</span>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
