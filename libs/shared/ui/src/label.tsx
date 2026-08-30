import { cn } from '@mojo/shared/util';
import * as LabelPrimitive from '@radix-ui/react-label';
import type * as React from 'react';

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}
