import { cn } from '@mojo/shared/util';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

const badgeVariants = cva(
  'block inline-flex items-center gap-1.5 rounded-full border border-transparent px-1 py-.5 font-mono text-xs font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        tertiary: 'bg-tertiary text-tertiary-foreground',
        outline: 'border-border bg-transparent text-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
