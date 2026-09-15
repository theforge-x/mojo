// Central re-export of the Prisma-backed infrastructure classes the admin app
// composes when `USE_PRISMA=true`. Kept behind one file so the demo
// (in-memory) path never pulls Prisma-dependent code into its bundle.

export {
  PrismaAuditLogRepository,
  PrismaFeatureFlagRepository,
  PrismaSubjectTaxonomyRepository,
} from '@mojo/admin-config/infrastructure';
export { PrismaAnalyticsRepository } from '@mojo/analytics/infrastructure';
export { PrismaReviewRepository } from '@mojo/reviews/infrastructure';
export { PrismaDisputeRepository } from '@mojo/trust-safety/infrastructure';
export {
  PrismaApplicationRepository,
  PrismaTutorProfileRepository,
} from '@mojo/tutor-profile/infrastructure';
