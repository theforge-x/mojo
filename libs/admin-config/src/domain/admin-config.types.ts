export interface FeatureFlag {
  readonly key: string;
  readonly enabled: boolean;
  readonly rolloutPercent: number;
}

export interface AuditLogEntry {
  readonly id: string;
  readonly adminId: string;
  readonly action: string;
  readonly targetId: string | null;
  readonly at: string;
}

export interface SubjectTaxonomyEntry {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
}
