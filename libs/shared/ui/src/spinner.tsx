'use client';
import { cn } from '@mojo/shared/util';
import { Loader2 } from 'lucide-react';
import type * as React from 'react';

export function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2>) {
  return (
    <Loader2 data-slot="spinner" className={cn('size-4 animate-spin', className)} {...props} />
  );
}
