import { cn } from '@mojo/shared/util';
import type { ReactNode } from 'react';

export function StatTile({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className={cn('mt-1 text-sm font-semibold text-headline', valueClassName)}>{value}</div>
    </div>
  );
}
