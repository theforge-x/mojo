import type * as React from "react";
import { cn } from '@mojo/shared/util';

export function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn("flex flex-col items-center justify-center gap-1 py-8 text-center", className)}
      {...props}
    />
  );
}

export function EmptyTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="empty-title" className={cn("text-sm text-foreground", className)} {...props} />;
}

export function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="empty-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
