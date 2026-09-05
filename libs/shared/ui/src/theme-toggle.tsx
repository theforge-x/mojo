'use client';

import { cn } from '@mojo/shared/util';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './button';

export interface ThemeToggleProps {
  className?: string;
}

/**
 * Sun/Moon toggle for the class-strategy theme kickoff. Shows the icon for
 * the theme you'd switch to: while light, a Moon (click for dark mode); while
 * dark, a Sun (click for light mode).
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn('text-muted-foreground', className)}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
