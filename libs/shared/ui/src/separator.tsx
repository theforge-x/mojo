import * as SeparatorPrimitive from "@radix-ui/react-separator";
import type * as React from "react";
import { cn } from '@mojo/shared/util';

export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}
