import { cn } from '@mojo/shared/util';
import * as LabelPrimitive from '@radix-ui/react-label';
import type * as React from 'react';

export function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="field-group" className={cn('flex flex-col gap-4', className)} {...props} />
  );
}

export function Field({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'div'> & { orientation?: 'vertical' | 'horizontal' }) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        'flex flex-col gap-1.5',
        'data-disabled:cursor-not-allowed data-disabled:opacity-40',
        orientation === 'horizontal' && 'flex-row items-center justify-between gap-3',
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="field-label"
      className={cn(
        'text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

/** Non-form label for grouping controls that aren't a single labelled input — e.g. a ToggleGroup's heading. */
export function FieldTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="field-title"
      className={cn(
        'text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-sm text-muted-foreground in-data-invalid:text-destructive', className)}
      {...props}
    />
  );
}

export function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset data-slot="field-set" className={cn('flex flex-col gap-4', className)} {...props} />
  );
}

export function FieldLegend({ className, ...props }: React.ComponentProps<'legend'>) {
  return (
    <legend
      data-slot="field-legend"
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    />
  );
}
