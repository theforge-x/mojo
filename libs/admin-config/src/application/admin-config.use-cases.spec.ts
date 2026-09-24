import { describe, expect, it } from 'vitest';
import type {
  AuditLogRepository,
  FeatureFlagRepository,
  SubjectTaxonomyRepository,
} from '../domain/admin-config.ports';
import type {
  AuditLogEntry,
  FeatureFlag,
  SubjectTaxonomyEntry,
} from '../domain/admin-config.types';
import { makeAppendAuditLog } from './append-audit-log.use-case';
import { makeListSubjects } from './list-subjects.use-case';
import {
  CatalogEntryNotFoundError,
  CatalogValidationError,
  DomainHasSubjectsError,
  makeRemoveTaxonomyEntry,
  makeSaveTaxonomyEntry,
  makeSetTaxonomyActive,
} from './manage-subjects.use-case';
import { InvalidRolloutPercentError, makeSetFeatureFlag } from './set-feature-flag.use-case';

describe('setFeatureFlag', () => {
  it('persists a valid flag', async () => {
    let saved: FeatureFlag | null = null;
    const flags: FeatureFlagRepository = {
      findByKey: async () => saved,
      list: async () => (saved ? [saved] : []),
      save: async (flag) => {
        saved = flag;
      },
    };
    await makeSetFeatureFlag({ flags })({ key: 'show_v2', enabled: true, rolloutPercent: 50 });
    expect(saved).toMatchObject({ key: 'show_v2', rolloutPercent: 50 });
  });

  it('rejects an out-of-range rolloutPercent', async () => {
    const flags: FeatureFlagRepository = {
      findByKey: async () => null,
      list: async () => [],
      save: async () => {},
    };
    await expect(
      makeSetFeatureFlag({ flags })({ key: 'show_v2', enabled: true, rolloutPercent: 150 }),
    ).rejects.toThrow(InvalidRolloutPercentError);
  });
});

describe('appendAuditLog', () => {
  it('appends the entry through the repository', async () => {
    const written: AuditLogEntry[] = [];
    const logs: AuditLogRepository = { append: async (e) => written.push(e) };
    const entry: AuditLogEntry = {
      id: 'log_1',
      adminId: 'a_1',
      action: 'feature_flag.update',
      targetId: 'show_v2',
      at: '2026-09-01T10:00:00.000Z',
    };
    await makeAppendAuditLog({ logs })(entry);
    expect(written).toHaveLength(1);
    expect(written[0]?.action).toBe('feature_flag.update');
  });
});

describe('listSubjects', () => {
  it('returns subjects from the taxonomy repository', async () => {
    const rows: SubjectTaxonomyEntry[] = [
      { id: 'maths', name: 'Mathematics', parentId: null, active: true },
    ];
    const taxonomy: SubjectTaxonomyRepository = {
      list: async () => rows,
      save: async () => {},
      remove: async () => {},
    };
    const out = await makeListSubjects({ taxonomy })();
    expect(out).toHaveLength(1);
    expect(out[0]?.name).toBe('Mathematics');
  });
});

function memoryTaxonomy(
  seed: SubjectTaxonomyEntry[] = [],
): SubjectTaxonomyRepository & { rows: SubjectTaxonomyEntry[] } {
  const rows = [...seed];
  return {
    rows,
    list: async () => [...rows],
    save: async (entry) => {
      const index = rows.findIndex((e) => e.id === entry.id);
      if (index >= 0) rows[index] = entry;
      else rows.push(entry);
    },
    remove: async (id) => {
      const index = rows.findIndex((e) => e.id === id);
      if (index >= 0) rows.splice(index, 1);
    },
  };
}

describe('saveTaxonomyEntry', () => {
  it('creates a domain and a subject inside it', async () => {
    const taxonomy = memoryTaxonomy();
    const save = makeSaveTaxonomyEntry({ taxonomy });
    await save({ id: 'dom_music', name: 'Music', parentId: null });
    const piano = await save({ id: 'sub_piano', name: 'Piano', parentId: 'dom_music' });
    expect(piano).toMatchObject({ name: 'Piano', parentId: 'dom_music', active: true });
    expect(taxonomy.rows).toHaveLength(2);
  });

  it('rejects a subject without an existing domain', async () => {
    const taxonomy = memoryTaxonomy();
    await expect(
      makeSaveTaxonomyEntry({ taxonomy })({ id: 'sub_x', name: 'Piano', parentId: 'missing' }),
    ).rejects.toThrow(CatalogValidationError);
  });

  it('rejects a duplicate subject name within the same domain', async () => {
    const taxonomy = memoryTaxonomy([
      { id: 'dom_music', name: 'Music', parentId: null, active: true },
      { id: 'sub_piano', name: 'Piano', parentId: 'dom_music', active: true },
    ]);
    await expect(
      makeSaveTaxonomyEntry({ taxonomy })({ id: 'sub_p2', name: 'piano', parentId: 'dom_music' }),
    ).rejects.toThrow(CatalogValidationError);
  });

  it('renames an entry in place', async () => {
    const taxonomy = memoryTaxonomy([
      { id: 'dom_music', name: 'Music', parentId: null, active: true },
    ]);
    const renamed = await makeSaveTaxonomyEntry({ taxonomy })({
      id: 'dom_music',
      name: 'Music & Audio',
      parentId: null,
    });
    expect(renamed.name).toBe('Music & Audio');
    expect(taxonomy.rows).toHaveLength(1);
  });
});

describe('setTaxonomyActive', () => {
  it('deactivating a domain cascades to its subjects', async () => {
    const taxonomy = memoryTaxonomy([
      { id: 'dom_music', name: 'Music', parentId: null, active: true },
      { id: 'sub_piano', name: 'Piano', parentId: 'dom_music', active: true },
    ]);
    await makeSetTaxonomyActive({ taxonomy })({ id: 'dom_music', active: false });
    expect(taxonomy.rows.every((e) => !e.active)).toBe(true);
  });

  it('throws for an unknown id', async () => {
    const taxonomy = memoryTaxonomy();
    await expect(
      makeSetTaxonomyActive({ taxonomy })({ id: 'nope', active: false }),
    ).rejects.toThrow(CatalogEntryNotFoundError);
  });
});

describe('removeTaxonomyEntry', () => {
  it('removes a subject outright', async () => {
    const taxonomy = memoryTaxonomy([
      { id: 'dom_music', name: 'Music', parentId: null, active: true },
      { id: 'sub_piano', name: 'Piano', parentId: 'dom_music', active: true },
    ]);
    await makeRemoveTaxonomyEntry({ taxonomy })('sub_piano');
    expect(taxonomy.rows.map((e) => e.id)).toEqual(['dom_music']);
  });

  it('blocks removing a domain that still has subjects', async () => {
    const taxonomy = memoryTaxonomy([
      { id: 'dom_music', name: 'Music', parentId: null, active: true },
      { id: 'sub_piano', name: 'Piano', parentId: 'dom_music', active: true },
    ]);
    await expect(makeRemoveTaxonomyEntry({ taxonomy })('dom_music')).rejects.toThrow(
      DomainHasSubjectsError,
    );
  });
});
