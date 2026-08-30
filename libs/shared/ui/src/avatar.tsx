import { cn } from '@mojo/shared/util';
import { cva, type VariantProps } from 'class-variance-authority';

const avatarVariants = cva(
  'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-display font-bold text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  src?: string;
  alt?: string;
  className?: string;
}

/**
 * Initials gravatar: renders the image when `src` is present, otherwise the
 * subject's initials on the paper background. `src` may be a URL or a data
 * URL captured from a local file picker.
 */
export function Avatar({ name, src, alt, size, className }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span className={cn(avatarVariants({ size }), className)} aria-hidden={src ? undefined : true}>
      {src ? (
        // biome-ignore lint/performance/noImgElement: plain <img> keeps <Avatar> renderer-agnostic
        <img src={src} alt={alt ?? name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials || '•'}</span>
      )}
    </span>
  );
}
