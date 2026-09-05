// @ts-check
const path = require('node:path');
const { loadEnvConfig } = require('@next/env');

// Nx runs `next dev`/`next build` from this app's directory, so Next would
// otherwise only load apps/admin/.env — which doesn't exist. Mojo keeps a
// single workspace-root .env (see .env.example); load it here so this app
// sees the same configuration as every other app in the workspace. Values
// already present in the environment (CI, production hosts) win.
loadEnvConfig(path.resolve(__dirname, '../..'), process.env.NODE_ENV !== 'production');

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@mojo/shared/ui'],
};
