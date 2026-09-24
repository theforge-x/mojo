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

/**
 * Subject catalogue. A `parentId` of null marks a subject *domain* (e.g.
 * Music); any other entry is a subject that must belong to a domain (e.g.
 * Piano → Music). `active` gates visibility across the hub — deactivated
 * domains/subjects disappear from search filters and the apply form while
 * existing tutor profiles keep their stored names.
 */
export interface SubjectTaxonomyEntry {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly active: boolean;
}

/** Canonical demo/seed catalogue shared by the hub and admin fallback stores. */
export const DEFAULT_TAXONOMY_SEED: readonly SubjectTaxonomyEntry[] = [
  { id: 'dom_languages', name: 'Languages', parentId: null, active: true },
  { id: 'sub_spanish', name: 'Spanish', parentId: 'dom_languages', active: true },
  { id: 'sub_french', name: 'French', parentId: 'dom_languages', active: true },
  { id: 'sub_english', name: 'English', parentId: 'dom_languages', active: true },
  { id: 'sub_yoruba', name: 'Yoruba', parentId: 'dom_languages', active: true },
  { id: 'sub_igbo', name: 'Igbo', parentId: 'dom_languages', active: true },
  { id: 'sub_hausa', name: 'Hausa', parentId: 'dom_languages', active: true },
  { id: 'dom_music', name: 'Music', parentId: null, active: true },
  { id: 'sub_guitar', name: 'Guitar', parentId: 'dom_music', active: true },
  { id: 'sub_piano', name: 'Piano', parentId: 'dom_music', active: true },
  { id: 'dom_academics', name: 'Academics', parentId: null, active: true },
  { id: 'sub_maths', name: 'Maths', parentId: 'dom_academics', active: true },
  { id: 'sub_physics', name: 'Physics', parentId: 'dom_academics', active: true },
  { id: 'sub_chemistry', name: 'Chemistry', parentId: 'dom_academics', active: true },
  { id: 'sub_biology', name: 'Biology', parentId: 'dom_academics', active: true },
  { id: 'dom_tech_business', name: 'Technology & Business', parentId: null, active: true },
  { id: 'sub_python', name: 'Python', parentId: 'dom_tech_business', active: true },
  { id: 'sub_economics', name: 'Economics', parentId: 'dom_tech_business', active: true },
  { id: 'sub_business', name: 'Business', parentId: 'dom_tech_business', active: true },
  { id: 'sub_art_design', name: 'Art & Design', parentId: 'dom_tech_business', active: true },
];
