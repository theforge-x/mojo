'use client';

import type { SubjectTaxonomyEntry } from '@mojo/admin-config/domain';
import { Alert, Badge, Button, Card, CardContent, Input } from '@mojo/shared/ui';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface DomainGroup {
  domain: SubjectTaxonomyEntry;
  subjects: SubjectTaxonomyEntry[];
}

function newId(prefix: 'dom' | 'sub'): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function SubjectsManager({ initial }: { initial: readonly SubjectTaxonomyEntry[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const groups = useMemo<DomainGroup[]>(() => {
    const domains = initial
      .filter((e) => e.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name));
    const byParent = new Map<string, SubjectTaxonomyEntry[]>();
    for (const entry of initial.filter((e) => e.parentId !== null)) {
      const list = byParent.get(entry.parentId ?? '') ?? [];
      list.push(entry);
      byParent.set(entry.parentId ?? '', list);
    }
    for (const list of byParent.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return domains.map((domain) => ({ domain, subjects: byParent.get(domain.id) ?? [] }));
  }, [initial]);

  const orphans = useMemo(
    () => initial.filter((e) => e.parentId !== null && !initial.some((d) => d.id === e.parentId)),
    [initial],
  );

  async function mutate(label: string, run: () => Promise<Response>) {
    setBusy(label);
    setError(null);
    try {
      const response = await run();
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Could not save change.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save change.');
    } finally {
      setBusy(null);
    }
  }

  const saveEntry = (id: string, name: string, parentId: string | null) =>
    mutate(`save:${id}`, () =>
      fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, parentId }),
      }),
    ).then(() => setEditing(null));

  const setActive = (id: string, active: boolean) =>
    mutate(`active:${id}`, () =>
      fetch('/api/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active }),
      }),
    );

  const remove = (id: string) =>
    mutate(`remove:${id}`, () =>
      fetch(`/api/catalog?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
    );

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!newDomain.trim()) return;
          void mutate('save:new-domain', () =>
            fetch('/api/catalog', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: newId('dom'), name: newDomain.trim(), parentId: null }),
            }),
          ).then(() => setNewDomain(''));
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <Input
          value={newDomain}
          onChange={(event) => setNewDomain(event.target.value)}
          placeholder="New domain — e.g. Music"
          aria-label="New domain name"
          maxLength={48}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={busy !== null || !newDomain.trim()}>
          <Plus className="size-4" aria-hidden />
          {busy === 'save:new-domain' ? 'Adding…' : 'Add domain'}
        </Button>
      </form>

      {error && <Alert variant="danger">{error}</Alert>}

      {groups.map(({ domain, subjects }) => (
        <Card key={domain.id} className={!domain.active ? 'opacity-75' : undefined}>
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-center gap-2">
              {editing === domain.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const name = (drafts[domain.id] ?? domain.name).trim();
                    if (name) void saveEntry(domain.id, name, null);
                  }}
                >
                  <Input
                    value={drafts[domain.id] ?? domain.name}
                    onChange={(event) =>
                      setDrafts((d) => ({ ...d, [domain.id]: event.target.value }))
                    }
                    aria-label={`Rename ${domain.name}`}
                    maxLength={48}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={busy !== null}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <h3 className="font-display text-base font-bold text-headline">{domain.name}</h3>
                  <Badge variant={domain.active ? 'primary' : 'muted'}>
                    {domain.active ? 'active' : 'hidden'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {subjects.length} subject{subjects.length === 1 ? '' : 's'}
                  </span>
                  <span className="ms-auto flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Rename ${domain.name}`}
                      disabled={busy !== null}
                      onClick={() => {
                        setEditing(domain.id);
                        setDrafts((d) => ({ ...d, [domain.id]: domain.name }));
                      }}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={domain.active ? 'outline' : 'primary'}
                      disabled={busy !== null}
                      onClick={() => void setActive(domain.id, !domain.active)}
                    >
                      <Power className="size-4" aria-hidden />
                      {busy === `active:${domain.id}`
                        ? '…'
                        : domain.active
                          ? 'Deactivate'
                          : 'Activate'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ${domain.name}`}
                      disabled={busy !== null}
                      onClick={() => void remove(domain.id)}
                    >
                      {busy === `remove:${domain.id}` ? (
                        '…'
                      ) : (
                        <Trash2 className="size-4" aria-hidden />
                      )}
                    </Button>
                  </span>
                </>
              )}
            </div>

            <ul className="space-y-1.5">
              {subjects.map((subject) => (
                <li
                  key={subject.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                >
                  {editing === subject.id ? (
                    <form
                      className="flex flex-1 items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const name = (drafts[subject.id] ?? subject.name).trim();
                        if (name) void saveEntry(subject.id, name, subject.parentId);
                      }}
                    >
                      <Input
                        value={drafts[subject.id] ?? subject.name}
                        onChange={(event) =>
                          setDrafts((d) => ({ ...d, [subject.id]: event.target.value }))
                        }
                        aria-label={`Rename ${subject.name}`}
                        maxLength={48}
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" disabled={busy !== null}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <>
                      <span
                        className={`flex-1 text-sm ${subject.active ? 'text-headline' : 'text-muted-foreground line-through'}`}
                      >
                        {subject.name}
                      </span>
                      <Badge variant={subject.active ? 'primary' : 'muted'}>
                        {subject.active ? 'active' : 'hidden'}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Rename ${subject.name}`}
                        disabled={busy !== null}
                        onClick={() => {
                          setEditing(subject.id);
                          setDrafts((d) => ({ ...d, [subject.id]: subject.name }));
                        }}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={
                          subject.active ? `Deactivate ${subject.name}` : `Activate ${subject.name}`
                        }
                        disabled={busy !== null}
                        onClick={() => void setActive(subject.id, !subject.active)}
                      >
                        <Power className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Remove ${subject.name}`}
                        disabled={busy !== null}
                        onClick={() => void remove(subject.id)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {addingTo === domain.id ? (
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!newSubject.trim()) return;
                  void mutate(`save:new-subject:${domain.id}`, () =>
                    fetch('/api/catalog', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: newId('sub'),
                        name: newSubject.trim(),
                        parentId: domain.id,
                      }),
                    }),
                  ).then(() => {
                    setNewSubject('');
                    setAddingTo(null);
                  });
                }}
              >
                <Input
                  value={newSubject}
                  onChange={(event) => setNewSubject(event.target.value)}
                  placeholder={`New subject in ${domain.name} — e.g. Piano`}
                  aria-label={`New subject in ${domain.name}`}
                  maxLength={48}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={busy !== null || !newSubject.trim()}>
                  Add subject
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAddingTo(null);
                    setNewSubject('');
                  }}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy !== null || !domain.active}
                onClick={() => setAddingTo(domain.id)}
              >
                <Plus className="size-4" aria-hidden />
                Add subject
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {orphans.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="font-display text-base font-bold text-headline">Ungrouped</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              These subjects point at a domain that no longer exists — remove them or recreate the
              domain.
            </p>
            <ul className="mt-2 space-y-1.5">
              {orphans.map((subject) => (
                <li
                  key={subject.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="flex-1">{subject.name}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove ${subject.name}`}
                    disabled={busy !== null}
                    onClick={() => void remove(subject.id)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
