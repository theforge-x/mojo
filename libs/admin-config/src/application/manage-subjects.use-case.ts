import type { SubjectTaxonomyRepository } from '../domain/admin-config.ports';
import type { SubjectTaxonomyEntry } from '../domain/admin-config.types';

export class CatalogValidationError extends Error {
  constructor(readonly reasons: readonly string[]) {
    super(`Invalid catalogue entry — ${reasons.join(' ')}`);
  }
}

export class DomainHasSubjectsError extends Error {
  constructor(readonly subjectCount: number) {
    super(
      `This domain still has ${subjectCount} subject${subjectCount === 1 ? '' : 's'} — remove or move them first.`,
    );
  }
}

export class CatalogEntryNotFoundError extends Error {
  constructor(readonly entryId: string) {
    super(`Catalogue entry "${entryId}" does not exist.`);
  }
}

export interface SaveTaxonomyEntryInput {
  readonly id: string;
  readonly name: string;
  /** Null for a subject domain, otherwise the owning domain's id. */
  readonly parentId: string | null;
  readonly active?: boolean;
}

function normalize(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function sameName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Creates or renames a subject domain (`parentId: null`) or a subject inside
 * a domain. Every subject must belong to an existing domain; names are unique
 * among sibling entries (case-insensitive). New entries start active unless
 * the caller says otherwise; toggling uses `setTaxonomyActive` instead.
 */
export function makeSaveTaxonomyEntry(deps: { taxonomy: SubjectTaxonomyRepository }) {
  return async function saveTaxonomyEntry(
    input: SaveTaxonomyEntryInput,
  ): Promise<SubjectTaxonomyEntry> {
    const name = normalize(input.name);
    const reasons: string[] = [];
    if (name.length < 2) reasons.push('Name must be at least 2 characters.');
    if (name.length > 48) reasons.push('Name must be at most 48 characters.');
    if (!input.id.trim()) reasons.push('An id is required.');

    const entries = await deps.taxonomy.list();
    const existing = entries.find((e) => e.id === input.id) ?? null;

    let parent: SubjectTaxonomyEntry | null = null;
    if (input.parentId !== null) {
      parent = entries.find((e) => e.id === input.parentId) ?? null;
      if (!parent) reasons.push('The chosen domain does not exist.');
      else if (parent.parentId !== null || parent.id === input.id)
        reasons.push('A subject must belong to a domain, not another subject.');
    }

    const siblings = entries.filter(
      (e) => (e.parentId ?? null) === (input.parentId ?? null) && e.id !== input.id,
    );
    if (siblings.some((e) => sameName(e.name, name))) {
      reasons.push(
        input.parentId === null
          ? `A domain named "${name}" already exists.`
          : `This domain already has a subject named "${name}".`,
      );
    }

    if (reasons.length > 0) throw new CatalogValidationError(reasons);

    const entry: SubjectTaxonomyEntry = {
      id: input.id,
      name,
      parentId: input.parentId,
      active: input.active ?? existing?.active ?? true,
    };
    await deps.taxonomy.save(entry);
    return entry;
  };
}

/**
 * Activates/deactivates a domain or subject. Deactivating a domain cascades
 * to its subjects so nothing orphaned stays visible; activating a domain
 * leaves its subjects untouched so each subject is a deliberate choice.
 */
export function makeSetTaxonomyActive(deps: { taxonomy: SubjectTaxonomyRepository }) {
  return async function setTaxonomyActive(input: {
    id: string;
    active: boolean;
  }): Promise<SubjectTaxonomyEntry> {
    const entries = await deps.taxonomy.list();
    const entry = entries.find((e) => e.id === input.id);
    if (!entry) throw new CatalogEntryNotFoundError(input.id);

    await deps.taxonomy.save({ ...entry, active: input.active });
    if (entry.parentId === null && !input.active) {
      for (const child of entries.filter((e) => e.parentId === entry.id && e.active)) {
        await deps.taxonomy.save({ ...child, active: false });
      }
    }
    return { ...entry, active: input.active };
  };
}

/**
 * Removes a subject outright, or a domain once it has no subjects left.
 * Stored tutor profiles keep plain subject-name strings, so removing a
 * subject never rewrites history — it just stops new uses.
 */
export function makeRemoveTaxonomyEntry(deps: { taxonomy: SubjectTaxonomyRepository }) {
  return async function removeTaxonomyEntry(id: string): Promise<void> {
    const entries = await deps.taxonomy.list();
    const entry = entries.find((e) => e.id === id);
    if (!entry) throw new CatalogEntryNotFoundError(id);
    if (entry.parentId === null) {
      const children = entries.filter((e) => e.parentId === id);
      if (children.length > 0) throw new DomainHasSubjectsError(children.length);
    }
    await deps.taxonomy.remove(id);
  };
}
