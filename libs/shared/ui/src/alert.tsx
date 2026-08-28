import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@mojo/shared/util';

const alertVariants = cva('flex gap-3 rounded-lg border p-4', {
  variants: {
    variant: {
      info: 'bg-accent border-primary/30',
      warning: 'bg-tertiary/15 border-tertiary/40',
      danger: 'bg-destructive/10 border-destructive/35',
    },
  },
  defaultVariants: { variant: 'info' },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant, className }))} {...props}>
      {children}
    </div>
  );
}
