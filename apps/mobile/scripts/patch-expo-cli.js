/**
 * Postinstall patch for `@expo/cli` (nested under `expo/node_modules`).
 *
 * WHAT: the web `getPolyfills` in `withMetroMultiPlatform.js` requires
 * `react-native/rn-get-polyfills` and only tolerates MODULE_NOT_FOUND. RN
 * 0.86 removed that export mapping (moved to `@react-native/js-polyfills`),
 * so web bundling throws ERR_PACKAGE_PATH_NOT_EXPORTED.
 *
 * FIX: also catch ERR_PACKAGE_PATH_NOT_EXPORTED and fall back to the
 * maintained `@react-native/js-polyfills` successor (same `() => string[]`
 * shape), keeping the original MODULE_NOT_FOUND behaviour intact.
 *
 * Idempotent — safe to run on every install. Drop this file once the
 * installed @expo/cli contains the upstream fix (check for NOTE(mojo)).
 */
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const MARKER = 'NOTE(mojo)';
const TARGET = join(
  __dirname,
  '..',
  'node_modules',
  'expo',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'start',
  'server',
  'metro',
  'withMetroMultiPlatform.js',
);

const BEFORE = `            } catch (error) {
                if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
                    // If react-native is not installed, because we're targeting web, we still continue
                    // This should be rare, but we add it so we don't unnecessarily have a fixed peer dependency on react-native
                    debug('Skipping react-native/rn-get-polyfills from getPolyfills. react-native is not installed.');
                    return virtualModulesPolyfills;
                } else {
                    throw error;
                }`;

const AFTER = `            } catch (error) {
                // NOTE(mojo): RN 0.86 removed the 'rn-get-polyfills' export
                // mapping (moved to '@react-native/js-polyfills'), so this
                // throws ERR_PACKAGE_PATH_NOT_EXPORTED instead of
                // MODULE_NOT_FOUND. Fall back to the maintained successor.
                if ('code' in error &&
                    (error.code === 'MODULE_NOT_FOUND' ||
                        error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED')) {
                    let rnGetPolyfills = null;
                    try {
                        rnGetPolyfills = require('@react-native/js-polyfills');
                    } catch {
                        rnGetPolyfills = null;
                    }
                    if (!rnGetPolyfills) {
                        debug('Skipping react-native/rn-get-polyfills from getPolyfills. react-native is not installed.');
                        return virtualModulesPolyfills;
                    }
                    return [
                        ...virtualModulesPolyfills,
                        ...rnGetPolyfills().filter((x) => !x.includes('/console')),
                    ];
                } else {
                    throw error;
                }`;

if (!existsSync(TARGET)) {
  console.log('[patch-expo-cli] target not found (fresh install?) — skipping.');
  process.exit(0);
}
const source = readFileSync(TARGET, 'utf8');
if (source.includes(MARKER)) {
  console.log('[patch-expo-cli] already patched — skipping.');
  process.exit(0);
}
if (!source.includes(BEFORE)) {
  console.log('[patch-expo-cli] upstream code changed — patch does not apply. Review manually.');
  process.exit(1);
}
writeFileSync(TARGET, source.replace(BEFORE, AFTER));
console.log('[patch-expo-cli] patched web getPolyfills fallback.');
