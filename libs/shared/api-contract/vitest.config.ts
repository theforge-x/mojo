import { defineConfig } from 'vitest/config';
import { mojoAliases } from '../../../vitest.aliases';

export default defineConfig({
  test: { environment: 'node', globals: true, include: ['src/**/*.spec.ts'] },
  resolve: { alias: mojoAliases },
});
