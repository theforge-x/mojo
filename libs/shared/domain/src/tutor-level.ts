/**
 * A tutor's experience tier. Cross-cutting value shared by every module that
 * reasons about tutor levels, so that modules never depend on each other's
 * domain to obtain it.
 */
export type TutorLevel = 'entry' | 'established' | 'expert';
