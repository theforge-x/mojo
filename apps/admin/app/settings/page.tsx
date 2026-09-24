import { Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import { redirect } from 'next/navigation';
import { FlagToggle } from '../../components/flag-toggle';
import { SubjectsManager } from '../../components/subjects-manager';
import { getAdmin } from '../../demo/composition-root';
import { requireAdmin } from '../../lib/session';

const NAV = [
  { id: 'subjects', label: 'Subjects & domains' },
  { id: 'flags', label: 'Feature flags' },
] as const;

/**
 * Admin settings — the catalogue (subject domains and their subjects) plus
 * platform feature flags. The sidebar stays fixed while the main content
 * scrolls.
 */
export default async function AdminSettingsPage() {
  const adminUser = await requireAdmin();
  if (!adminUser) redirect('/login');
  const admin = getAdmin();
  const [entries, flags] = await Promise.all([admin.catalog.list(), admin.config.flags()]);

  const activeSubjects = entries.filter((e) => e.parentId !== null && e.active).length;
  const domains = entries.filter((e) => e.parentId === null).length;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-headline">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {domains} domain{domains === 1 ? '' : 's'} · {activeSubjects} active subject
        {activeSubjects === 1 ? '' : 's'} live on the hub.
      </p>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="shrink-0 lg:sticky lg:top-24 lg:w-56">
          <nav
            aria-label="Admin settings sections"
            className="rounded-xl border border-border bg-card p-2"
          >
            <ul className="space-y-0.5">
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-headline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section id="subjects" aria-label="Subjects and domains" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle>Subjects & domains</CardTitle>
                <p className="text-sm font-normal text-muted-foreground">
                  Every subject lives inside a domain — Piano belongs to Music, for example.
                  Deactivated entries disappear from tutor search and applications; removing a
                  domain is only possible once it has no subjects left.
                </p>
              </CardHeader>
              <CardContent>
                <SubjectsManager initial={[...entries]} />
              </CardContent>
            </Card>
          </section>

          <section id="flags" aria-label="Feature flags" className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle>Feature flags</CardTitle>
                <p className="text-sm font-normal text-muted-foreground">
                  Platform-wide switches with rollout percentages.
                </p>
              </CardHeader>
              <CardContent>
                {flags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No flags configured.</p>
                ) : (
                  <ul className="space-y-2">
                    {flags.map((flag) => (
                      <li
                        key={flag.key}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
                      >
                        <div>
                          <p className="font-mono text-sm font-medium text-headline">{flag.key}</p>
                          <p className="text-xs text-muted-foreground">
                            rollout {flag.rolloutPercent}%
                          </p>
                        </div>
                        <FlagToggle flag={flag} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
