'use client';

import { cn } from '@mojo/shared/util';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from './button';

export interface ThemeToggleProps {
  className?: string;
}

/**
 * Sun/Moon toggle for the class-strategy theme kickoff. Shows the icon for
 * the theme you'd switch to: while light, a Moon (click for dark mode); while
 * dark, a Sun (click for light mode).
 *
 * `resolvedTheme` is `undefined` during SSR, so the icon is gated on a
 * `mounted` flag: the server and the first client paint both render the Moon
 * placeholder, and the real icon swaps in after mount. Without that guard the
 * server Moon vs. client Sun (system theme already resolved) would fail
 * hydration on every load.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={
        mounted ? (isDark ? 'Switch to light mode' : 'Switch to dark mode') : 'Switch theme'
      }
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn('text-muted-foreground', className)}
    >
      {mounted && isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
