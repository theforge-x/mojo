import type { AuditLogEntry, FeatureFlag, SubjectTaxonomyEntry } from './admin-config.types';

export interface FeatureFlagRepository {
  findByKey(key: string): Promise<FeatureFlag | null>;
  list(): Promise<FeatureFlag[]>;
  save(flag: FeatureFlag): Promise<void>;
}

export interface AuditLogRepository {
  append(entry: AuditLogEntry): Promise<void>;
}

export interface SubjectTaxonomyRepository {
  list(): Promise<SubjectTaxonomyEntry[]>;
  /** Upsert by id. */
  save(entry: SubjectTaxonomyEntry): Promise<void>;
  remove(id: string): Promise<void>;
}
