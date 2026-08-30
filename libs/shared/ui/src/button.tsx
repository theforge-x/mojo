import { cn } from '@mojo/shared/util';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-[transform,box-shadow,opacity] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:shadow-[0_8px_20px_-8px_var(--primary)]',
        secondary:
          'bg-secondary text-secondary-foreground hover:shadow-[0_8px_20px_-8px_var(--secondary)]',
        tertiary:
          'bg-tertiary text-tertiary-foreground hover:shadow-[0_8px_20px_-8px_var(--tertiary)]',
        outline: 'border border-input bg-transparent text-headline hover:bg-muted',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
        ghost: 'bg-transparent text-headline hover:bg-muted',
      },
      size: {
        default: 'h-10 px-[18px]',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';
