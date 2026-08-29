import { MojoMark } from '@mojo/shared/ui';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 sm:flex-row">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MojoMark className="size-5" />
          <span className="font-display text-sm font-semibold text-headline">
            mojo<span className="text-secondary">.</span>
          </span>
          <span className="text-xs">Learn live. Tutoring for real life.</span>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} mojo · Made in Lagos
        </p>
      </div>
    </footer>
  );
}
