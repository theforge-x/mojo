'use client';
import { Loader2 } from "lucide-react";
import type * as React from "react";
import { cn } from '@mojo/shared/util';

export function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2>) {
  return <Loader2 data-slot="spinner" className={cn("size-4 animate-spin", className)} {...props} />;
}
