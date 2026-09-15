'use client';

import { ThemeProvider as NextThemesProvider } from '@teispace/next-themes';

/**
 * Class-strategy theme provider on top of next-themes: toggling writes a
 * `light`/`dark` class onto <html> so the `.dark` token block in
 * `styles/globals.css` applies, and the OS preference is the default until a
 * user picks otherwise. The consumer is just a client component mount, so this
 * stays importable from server layouts.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
