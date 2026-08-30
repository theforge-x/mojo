// Central re-export of the Prisma-backed infrastructure classes the admin app
// composes when `USE_PRISMA=true`. Scoped to the tutor-application loop — the
// admin's other surfaces (flags, disputes, audit log, analytics) stay
// in-memory until dedicated Prisma adapters exist. Kept behind one file so the
// demo (in-memory) path never pulls Prisma-dependent code into its bundle.

export {
  PrismaApplicationRepository,
  PrismaTutorProfileRepository,
} from '@mojo/tutor-profile/infrastructure';
