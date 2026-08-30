import { cn } from '@mojo/shared/util';

export function Checkbox({
  className,
  label,
  description,
  ...props
}: React.ComponentProps<'input'> & { label?: string; description?: string }) {
  return (
    <label
      className={cn(
        'flex items-start gap-3',
        props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...props}
      />
      <span className="flex flex-col gap-0.5">
        {label && <span className="text-sm font-medium text-foreground">{label}</span>}
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}
