// Central re-export of every Prisma-backed infrastructure class the hub app
// can compose when `USE_PRISMA=true`. Kept behind one file so the demo
// (in-memory) path never pulls Prisma-dependent code into its bundle.

export { PrismaRecapRepository } from '@mojo/ai-learning/infrastructure';
export { PrismaBookingRepository } from '@mojo/booking/infrastructure';
export { PrismaTutorSearchIndex } from '@mojo/discovery/infrastructure';
export { PrismaUserRepository } from '@mojo/identity/infrastructure';
export { PrismaMessageRepository } from '@mojo/messaging/infrastructure';
export { EmailDispatcher, WhatsAppDispatcher } from '@mojo/notifications/infrastructure';
export {
  PaystackPayoutRail,
  PrismaWalletRepository,
} from '@mojo/payments/infrastructure';
export { PrismaTutorLevelReader } from '@mojo/pricing/infrastructure';
export { PrismaReferralRepository } from '@mojo/referrals/infrastructure';
export { PrismaReviewRepository } from '@mojo/reviews/infrastructure';
export {
  PrismaAvailabilityRepository,
  PrismaSessionRepository,
} from '@mojo/scheduling/infrastructure';
export { PrismaDisputeRepository } from '@mojo/trust-safety/infrastructure';
export { PrismaTutorPerformanceRepository } from '@mojo/tutor-performance/infrastructure';
export {
  PrismaApplicationRepository,
  PrismaTutorProfileRepository,
} from '@mojo/tutor-profile/infrastructure';
