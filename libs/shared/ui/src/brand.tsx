import { cn } from '@mojo/shared/util';
import Link from 'next/link';

/**
 * The mojo logo mark (the "m" glyph from /logo.svg) as an inline SVG so it
 * scales with font-size-driven sizing utilities and stays crisp everywhere.
 */
export function MojoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden className={cn('size-6 shrink-0', className)}>
      <path
        d="M290.668 377.405A17.333 17.298 0 0 1 308 394.702 17.333 17.298 0 0 1 290.668 412a17.333 17.298 0 0 1-17.334-17.298 17.333 17.298 0 0 1 17.334-17.297"
        style={{ fill: '#fde24f', strokeWidth: 26.9603, strokeLinecap: 'round' }}
      />
      <path
        d="M186.667 100C139.007 100 100 138.927 100 186.488v21.691a17.656 17.62 0 0 0 17.012 12.904 17.656 17.62 0 0 0 .006 0 17.656 17.62 0 0 0 17.65-17.619v-16.976c0-28.864 23.075-51.893 51.999-51.893s52 23.029 52 51.893V342.15c0 12.76-6.686 23.763-16.806 29.759a34 34 0 0 1-3.294 1.717 17.333 17.298 0 0 0-7.706 14.383 17.333 17.298 0 0 0 17.334 17.299 17.333 17.298 0 0 0 6.541-1.286c.502-.25 1.021-.47 1.516-.733a17.333 17.298 0 0 0 .19-.101l.04-.022c21.857-11.687 36.852-34.7 36.852-61.016V221.226a17.333 17.298 0 0 1 0-.082 17.333 17.298 0 0 1 0-.06v-34.596c0-28.864 23.075-51.893 52-51.893 28.923 0 52 23.029 52 51.893v17.288a17.333 17.298 0 0 1 .082-1.246 17.333 17.298 0 0 0-.082 1.257 17.333 17.298 0 0 0 17.332 17.297A17.333 17.298 0 0 0 412 203.787a17.333 17.298 0 0 0 0-.002v-17.297c0-47.56-39.008-86.488-86.667-86.488-28.311 0-53.491 13.798-69.333 34.921C240.158 113.798 214.978 100 186.667 100"
        style={{ fill: '#00ebc7', strokeWidth: 27.4621, strokeLinecap: 'round' }}
      />
      <path
        d="M360 186.49a17.333 17.298 0 0 0-17.333 17.297c0 9.112-6.59 16.284-15.423 17.194-.627.065-1.263.103-1.91.103-.648 0-1.284-.038-1.91-.103-8.824-.91-15.408-8.065-15.424-17.162a17.333 17.298 0 0 0 0-.032 17.333 17.298 0 0 0-17.332-17.238 17.333 17.298 0 0 0-17.334 17.238 17.333 17.298 0 0 0 0 .06 17.333 17.298 0 0 0 .076 1.163 17.333 17.298 0 0 1-.076-1.08c.078 28.39 23.533 51.749 52 51.749 28.513 0 52-23.438 52-51.892A17.333 17.298 0 0 0 360 186.49M152.002 186.106a17.333 17.298 0 0 0-17.334 17.297v.061c.034 28.427 23.506 51.831 51.999 51.831 28.513 0 52-23.437 52-51.892a17.333 17.298 0 0 0-17.332-17.297A17.333 17.298 0 0 0 204 203.403c0 9.113-6.591 16.285-15.426 17.195-.626.064-1.261.102-1.908.102a19 19 0 0 1-1.908-.102c-8.835-.91-15.425-8.082-15.425-17.195a17.333 17.298 0 0 0-17.332-17.297"
        style={{ fill: '#ff5470', strokeWidth: 26.9603, strokeLinecap: 'round' }}
      />
    </svg>
  );
}

/** Mark + wordmark lockup — the standard brand treatment across the site. */
export function SiteLogo({ className, size }: { className?: string; size?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2 align-middle', className)}>
      <MojoMark className={cn('size-7', size)} />
      <span
        className={cn(
          'font-display text-xl font-semibold tracking-tight text-headline hover:text-secondary',
          className,
        )}
      >
        mojo<span className="text-secondary">.</span>
      </span>
    </Link>
  );
}
