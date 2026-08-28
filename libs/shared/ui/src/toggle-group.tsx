import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type * as React from "react";
import { cn } from '@mojo/shared/util';

export function ToggleGroup({
  className,
  spacing = 2,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & { spacing?: number }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("grid grid-flow-col auto-cols-fr", className)}
      style={{ gap: `${spacing * 0.25}rem` }}
      {...props}
    />
  );
}

export function ToggleGroupItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2.5 text-sm capitalize text-muted-foreground transition-[color,transform] duration-75 active:scale-[0.97]",
        "hover:text-foreground",
        "data-[state=on]:border-primary/60 data-[state=on]:bg-primary/10 data-[state=on]:text-foreground",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}
