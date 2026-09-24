import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const alertVariants = cva('flex gap-3 rounded-lg border p-4', {
  variants: {
    variant: {
      info: 'bg-accent border-primary/30 [&_.alert-icon]:bg-primary [&_.alert-icon]:text-primary-foreground',
      warning:
        'bg-tertiary/15 border-tertiary/40 [&_.alert-icon]:bg-tertiary [&_.alert-icon]:text-tertiary-foreground',
      danger:
        'bg-destructive/10 border-destructive/35 [&_.alert-icon]:bg-destructive [&_.alert-icon]:text-destructive-foreground',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
}

function Alert({ className, variant, icon, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant, className }))} {...props}>
      <div className="alert-icon mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
        {icon ?? '!'}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm font-bold text-headline', className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs leading-relaxed text-muted-foreground', className)} {...props} />
  );
}

export { Alert, AlertDescription, AlertTitle };
