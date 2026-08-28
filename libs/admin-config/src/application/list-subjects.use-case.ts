import type { SubjectTaxonomyRepository } from '../domain/admin-config.ports';
import type { SubjectTaxonomyEntry } from '../domain/admin-config.types';

export function makeListSubjects(deps: { taxonomy: SubjectTaxonomyRepository }) {
  return async function listSubjects(): Promise<SubjectTaxonomyEntry[]> {
    return deps.taxonomy.list();
  };
}
