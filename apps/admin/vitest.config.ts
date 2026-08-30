import { defineConfig } from 'vitest/config';
import { mojoAliases } from '../../vitest.aliases';

export default defineConfig({
  test: { environment: 'node', globals: true, include: ['demo/**/*.spec.ts'] },
  resolve: { alias: mojoAliases },
});
