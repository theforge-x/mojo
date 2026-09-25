// Central re-export of every Prisma-backed infrastructure class the hub app
// can compose when `USE_PRISMA=true`. Kept behind one file so the demo
// (in-memory) path never pulls Prisma-dependent code into its bundle.

export { PrismaSubjectTaxonomyRepository } from '@mojo/admin-config/infrastructure';
export { PrismaRecapRepository, summarizerFromEnv } from '@mojo/ai-learning/infrastructure';
export { PrismaPaymentMethodRepository } from '@mojo/billing/infrastructure';
export { PrismaBookingRepository } from '@mojo/booking/infrastructure';
export { PrismaTutorSearchIndex } from '@mojo/discovery/infrastructure';
export { PrismaUserRepository } from '@mojo/identity/infrastructure';
export { PrismaInterestRepository, PrismaMessageRepository } from '@mojo/messaging/infrastructure';
export { PrismaMojoPlusRepository } from '@mojo/mojo-plus/infrastructure';
export {
  EmailDispatcher,
  ExpoPushDispatcher,
  PrismaPushDeviceRepository,
  WhatsAppDispatcher,
} from '@mojo/notifications/infrastructure';
export {
  PaystackCollectAdapter,
  PaystackPayoutRail,
  PrismaChargeRepository,
  PrismaReplacementGrantRepository,
  PrismaWalletRepository,
} from '@mojo/payments/infrastructure';
export { PrismaTutorLevelReader } from '@mojo/pricing/infrastructure';
export { PrismaReferralRepository } from '@mojo/referrals/infrastructure';
export { PrismaReviewRepository } from '@mojo/reviews/infrastructure';
export {
  PrismaAvailabilityRepository,
  PrismaGroupLabRepository,
  PrismaSessionRepository,
} from '@mojo/scheduling/infrastructure';
export { PrismaDisputeRepository } from '@mojo/trust-safety/infrastructure';
export { PrismaTutorPerformanceRepository } from '@mojo/tutor-performance/infrastructure';
export {
  PrismaApplicationRepository,
  PrismaTutorProfileRepository,
} from '@mojo/tutor-profile/infrastructure';
