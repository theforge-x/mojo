// Central re-export of every Prisma-backed infrastructure class the hub app
// can compose when `USE_PRISMA=true`. Kept behind one file so the demo
// (in-memory) path never pulls Prisma-dependent code into its bundle.
export { PrismaUserRepository } from '@mojo/identity/infrastructure';
export {
  PrismaAvailabilityRepository,
  PrismaSessionRepository,
} from '@mojo/scheduling/infrastructure';
export { PrismaBookingRepository } from '@mojo/booking/infrastructure';
export { PrismaTutorLevelReader } from '@mojo/pricing/infrastructure';
export {
  PrismaWalletRepository,
  PaystackPayoutRail,
} from '@mojo/payments/infrastructure';
export { PrismaTutorPerformanceRepository } from '@mojo/tutor-performance/infrastructure';
export { PrismaRecapRepository } from '@mojo/ai-learning/infrastructure';
export { PrismaReviewRepository } from '@mojo/reviews/infrastructure';
export { PrismaReferralRepository } from '@mojo/referrals/infrastructure';
export { PrismaDisputeRepository } from '@mojo/trust-safety/infrastructure';
export { PrismaMessageRepository } from '@mojo/messaging/infrastructure';
export { PrismaTutorSearchIndex } from '@mojo/discovery/infrastructure';
export {
  PrismaApplicationRepository,
  PrismaTutorProfileRepository,
} from '@mojo/tutor-profile/infrastructure';
export { EmailDispatcher, WhatsAppDispatcher } from '@mojo/notifications/infrastructure';