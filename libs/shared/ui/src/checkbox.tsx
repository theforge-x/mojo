'use client';

import { cn } from '@mojo/shared/util';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import type * as React from 'react';

type CheckboxProps = Omit<
  React.ComponentProps<typeof CheckboxPrimitive.Root>,
  'onCheckedChange'
> & {
  label?: string;
  description?: string;
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({
  className,
  label,
  description,
  onCheckedChange,
  ...props
}: CheckboxProps) {
  return (
    <div data-slot="checkbox" className={cn('flex items-start gap-3', className)}>
      <CheckboxPrimitive.Root
        className={cn(
          'peer mt-0.5 size-4 shrink-0 rounded-[4px] border border-input bg-background outline-none transition-colors',
          'focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none',
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
          'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        )}
        onCheckedChange={(checked) => onCheckedChange?.(checked === true)}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-primary-foreground">
          <Check className="size-3.5" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <span className="flex flex-col gap-0.5">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </span>
      )}
    </div>
  );
}
