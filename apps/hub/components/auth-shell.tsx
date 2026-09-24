import { SiteLogo } from '@mojo/shared/ui';
import type { ReactNode } from 'react';

export function AuthShell({
  children,
  maxWidth = 'md',
}: {
  children: ReactNode;
  maxWidth?: 'sm' | 'md';
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className={`w-full space-y-6 ${maxWidth === 'sm' ? 'max-w-sm' : 'max-w-md'}`}>
        <SiteLogo />
        {children}
      </div>
    </main>
  );
}
