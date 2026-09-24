import { cn } from '@mojo/shared/util';
import type * as React from 'react';

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground/60 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'flex min-h-20 w-full rounded-md border bg-background px-3 py-2 text-base transition-[color,box-shadow] outline-none md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
