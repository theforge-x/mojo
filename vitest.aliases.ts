import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Path-alias map mirroring tsconfig.base.json. Vitest/Vite does not read
 * tsconfig paths automatically, so every module's vitest.config.ts imports
 * this to resolve @mojo/* imports to their source barrels.
 */
export const mojoAliases: Record<string, string> = {
  '@mojo/shared/ui': path.resolve(repoRoot, 'libs/shared/ui/src/index.ts'),
  '@mojo/shared/util': path.resolve(repoRoot, 'libs/shared/util/src/index.ts'),
  '@mojo/shared/domain': path.resolve(repoRoot, 'libs/shared/domain/src/index.ts'),
  '@mojo/shared/events': path.resolve(repoRoot, 'libs/shared/events/src/index.ts'),
  '@mojo/demo-state': path.resolve(repoRoot, 'libs/demo-state/src/index.ts'),
  '@mojo/identity/domain': path.resolve(repoRoot, 'libs/identity/src/domain/index.ts'),
  '@mojo/identity/application': path.resolve(repoRoot, 'libs/identity/src/application/index.ts'),
  '@mojo/identity/infrastructure': path.resolve(
    repoRoot,
    'libs/identity/src/infrastructure/index.ts',
  ),
  '@mojo/identity/feature': path.resolve(repoRoot, 'libs/identity/src/feature/index.ts'),
  '@mojo/scheduling/domain': path.resolve(repoRoot, 'libs/scheduling/src/domain/index.ts'),
  '@mojo/scheduling/application': path.resolve(
    repoRoot,
    'libs/scheduling/src/application/index.ts',
  ),
  '@mojo/scheduling/infrastructure': path.resolve(
    repoRoot,
    'libs/scheduling/src/infrastructure/index.ts',
  ),
  '@mojo/scheduling/feature': path.resolve(repoRoot, 'libs/scheduling/src/feature/index.ts'),
  '@mojo/booking/domain': path.resolve(repoRoot, 'libs/booking/src/domain/index.ts'),
  '@mojo/booking/application': path.resolve(repoRoot, 'libs/booking/src/application/index.ts'),
  '@mojo/booking/infrastructure': path.resolve(
    repoRoot,
    'libs/booking/src/infrastructure/index.ts',
  ),
  '@mojo/pricing/domain': path.resolve(repoRoot, 'libs/pricing/src/domain/index.ts'),
  '@mojo/pricing/application': path.resolve(repoRoot, 'libs/pricing/src/application/index.ts'),
  '@mojo/pricing/infrastructure': path.resolve(
    repoRoot,
    'libs/pricing/src/infrastructure/index.ts',
  ),
  '@mojo/mojo-plus/domain': path.resolve(repoRoot, 'libs/mojo-plus/src/domain/index.ts'),
  '@mojo/mojo-plus/application': path.resolve(repoRoot, 'libs/mojo-plus/src/application/index.ts'),
  '@mojo/payments/domain': path.resolve(repoRoot, 'libs/payments/src/domain/index.ts'),
  '@mojo/payments/application': path.resolve(repoRoot, 'libs/payments/src/application/index.ts'),
  '@mojo/payments/infrastructure': path.resolve(
    repoRoot,
    'libs/payments/src/infrastructure/index.ts',
  ),
  '@mojo/lab/domain': path.resolve(repoRoot, 'libs/lab/src/domain/index.ts'),
  '@mojo/lab/infrastructure': path.resolve(repoRoot, 'libs/lab/src/infrastructure/index.ts'),
  '@mojo/lab/feature': path.resolve(repoRoot, 'libs/lab/src/feature/index.ts'),
  '@mojo/tutor-profile/domain': path.resolve(repoRoot, 'libs/tutor-profile/src/domain/index.ts'),
  '@mojo/tutor-profile/application': path.resolve(
    repoRoot,
    'libs/tutor-profile/src/application/index.ts',
  ),
  '@mojo/tutor-profile/infrastructure': path.resolve(
    repoRoot,
    'libs/tutor-profile/src/infrastructure/index.ts',
  ),
  '@mojo/tutor-performance/domain': path.resolve(
    repoRoot,
    'libs/tutor-performance/src/domain/index.ts',
  ),
  '@mojo/tutor-performance/application': path.resolve(
    repoRoot,
    'libs/tutor-performance/src/application/index.ts',
  ),
  '@mojo/tutor-performance/infrastructure': path.resolve(
    repoRoot,
    'libs/tutor-performance/src/infrastructure/index.ts',
  ),
  '@mojo/discovery/domain': path.resolve(repoRoot, 'libs/discovery/src/domain/index.ts'),
  '@mojo/discovery/application': path.resolve(repoRoot, 'libs/discovery/src/application/index.ts'),
  '@mojo/discovery/infrastructure': path.resolve(
    repoRoot,
    'libs/discovery/src/infrastructure/index.ts',
  ),
  '@mojo/billing/domain': path.resolve(repoRoot, 'libs/billing/src/domain/index.ts'),
  '@mojo/billing/application': path.resolve(repoRoot, 'libs/billing/src/application/index.ts'),
  '@mojo/billing/infrastructure': path.resolve(
    repoRoot,
    'libs/billing/src/infrastructure/index.ts',
  ),
  '@mojo/messaging/domain': path.resolve(repoRoot, 'libs/messaging/src/domain/index.ts'),
  '@mojo/messaging/application': path.resolve(repoRoot, 'libs/messaging/src/application/index.ts'),
  '@mojo/messaging/infrastructure': path.resolve(
    repoRoot,
    'libs/messaging/src/infrastructure/index.ts',
  ),
  '@mojo/reviews/domain': path.resolve(repoRoot, 'libs/reviews/src/domain/index.ts'),
  '@mojo/reviews/application': path.resolve(repoRoot, 'libs/reviews/src/application/index.ts'),
  '@mojo/reviews/infrastructure': path.resolve(
    repoRoot,
    'libs/reviews/src/infrastructure/index.ts',
  ),
  '@mojo/referrals/domain': path.resolve(repoRoot, 'libs/referrals/src/domain/index.ts'),
  '@mojo/referrals/application': path.resolve(repoRoot, 'libs/referrals/src/application/index.ts'),
  '@mojo/referrals/infrastructure': path.resolve(
    repoRoot,
    'libs/referrals/src/infrastructure/index.ts',
  ),
  '@mojo/trust-safety/domain': path.resolve(repoRoot, 'libs/trust-safety/src/domain/index.ts'),
  '@mojo/trust-safety/application': path.resolve(
    repoRoot,
    'libs/trust-safety/src/application/index.ts',
  ),
  '@mojo/trust-safety/infrastructure': path.resolve(
    repoRoot,
    'libs/trust-safety/src/infrastructure/index.ts',
  ),
  '@mojo/ai-learning/domain': path.resolve(repoRoot, 'libs/ai-learning/src/domain/index.ts'),
  '@mojo/ai-learning/application': path.resolve(
    repoRoot,
    'libs/ai-learning/src/application/index.ts',
  ),
  '@mojo/ai-learning/infrastructure': path.resolve(
    repoRoot,
    'libs/ai-learning/src/infrastructure/index.ts',
  ),
  '@mojo/notifications/domain': path.resolve(repoRoot, 'libs/notifications/src/domain/index.ts'),
  '@mojo/notifications/application': path.resolve(
    repoRoot,
    'libs/notifications/src/application/index.ts',
  ),
  '@mojo/notifications/infrastructure': path.resolve(
    repoRoot,
    'libs/notifications/src/infrastructure/index.ts',
  ),
  '@mojo/admin-config/domain': path.resolve(repoRoot, 'libs/admin-config/src/domain/index.ts'),
  '@mojo/admin-config/application': path.resolve(
    repoRoot,
    'libs/admin-config/src/application/index.ts',
  ),
  '@mojo/admin-config/infrastructure': path.resolve(
    repoRoot,
    'libs/admin-config/src/infrastructure/index.ts',
  ),
  '@mojo/analytics/domain': path.resolve(repoRoot, 'libs/analytics/src/domain/index.ts'),
  '@mojo/analytics/application': path.resolve(repoRoot, 'libs/analytics/src/application/index.ts'),
  '@mojo/analytics/infrastructure': path.resolve(
    repoRoot,
    'libs/analytics/src/infrastructure/index.ts',
  ),
};
