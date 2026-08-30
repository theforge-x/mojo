import nxPlugin from '@nx/eslint-plugin';
import tsEsLint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import mojoCleanArchitecture from './tools/eslint/mojo-clean-architecture.mjs';

const SHARED = ['scope:shared', 'type:domain', 'type:ui', 'type:util'];

// Modules whose only allowed cross-module dependency is shared -> keep SHARED alone.
const SHARED_ONLY = [
  'identity',
  'scheduling',
  'pricing',
  'payments',
  'mojo-plus',
  'lab',
  'tutor-profile',
  'billing',
  'booking',
  'messaging',
  'reviews',
  'referrals',
  'trust-safety',
  'ai-learning',
  'notifications',
  'admin-config',
  'analytics',
  'tutor-performance',
];

const withPeers = (module, peers) => ({
  sourceTag: `scope:${module}`,
  onlyDependOnLibsWithTags: [...SHARED, ...peers],
});

const IGNORES = [
  '**/vitest.config.ts',
  '**/vitest.aliases.ts',
  '**/*.config.mjs',
  '**/.next/**',
  '**/dist/**',
  '**/node_modules/**',
  '**/coverage/**',
  '**/*.gen.ts',
  '**/docs/**',
];

export default [
  ...nxPlugin.configs['flat/base'],
  { ignores: IGNORES },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@typescript-eslint': tsEsLint,
      '@mojo': { rules: { 'clean-architecture': mojoCleanArchitecture } },
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      '@mojo/clean-architecture': 'error',
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          // Root stylesheet is a cross-project CSS side-effect import (no alias exists).
          allow: ['/libs/shared/ui/src/styles/globals.css'],
          depConstraints: [
            // Shared libs may only depend on other shared libs (never on a domain module).
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: SHARED },
            // Applications (hub, admin) may consume any module.
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['*'] },
            // Each bounded module depends on the shared libs plus its explicit peers only.
            ...SHARED_ONLY.map((m) => withPeers(m, [])),
            // Cross-module contract usage, derived from the architecture:
            // discovery/infrastructure reads pricing's published rate contract.
            withPeers('discovery', ['scope:pricing']),
          ],
        },
      ],
    },
  },
];
