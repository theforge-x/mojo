import { defineConfig } from 'vitest/config';

// Root project registry (vitest 4 `test.projects` — the standalone
// `vitest.workspace.ts` file is no longer picked up, which is why root runs
// used to execute every spec with zero config and fail all `@mojo/*`
// alias imports).
// Every lib with a vitest.config.ts opts into the workspace test run.
// Deliberately not a glob over all of libs/* — a module without a
// vitest.config.ts is one that hasn't earned a test suite yet, not one
// silently skipped by a misconfigured glob.
export default defineConfig({
  test: {
    projects: [
      'apps/admin/vitest.config.ts',
      'libs/shared/events/vitest.config.ts',
      'libs/identity/vitest.config.ts',
      'libs/scheduling/vitest.config.ts',
      'libs/pricing/vitest.config.ts',
      'libs/booking/vitest.config.ts',
      'libs/payments/vitest.config.ts',
      'libs/mojo-plus/vitest.config.ts',
      'libs/tutor-profile/vitest.config.ts',
      'libs/tutor-performance/vitest.config.ts',
      'libs/discovery/vitest.config.ts',
      'libs/billing/vitest.config.ts',
      'libs/messaging/vitest.config.ts',
      'libs/reviews/vitest.config.ts',
      'libs/referrals/vitest.config.ts',
      'libs/trust-safety/vitest.config.ts',
      'libs/ai-learning/vitest.config.ts',
      'libs/notifications/vitest.config.ts',
      'libs/admin-config/vitest.config.ts',
      'libs/analytics/vitest.config.ts',
      'libs/lab/vitest.config.ts',
    ],
  },
});
