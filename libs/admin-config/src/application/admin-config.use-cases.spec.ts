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
    const rows: SubjectTaxonomyEntry[] = [{ id: 'maths', name: 'Mathematics', parentId: null }];
    const taxonomy: SubjectTaxonomyRepository = {
      list: async () => rows,
      save: async () => {},
    };
    const out = await makeListSubjects({ taxonomy })();
    expect(out).toHaveLength(1);
    expect(out[0]?.name).toBe('Mathematics');
  });
});
