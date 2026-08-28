// @ts-check
const { composePlugins, withNx } = require('@nx/next');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mojo/shared/ui'],
};

const plugins = [withNx];
module.exports = composePlugins(...plugins)(nextConfig);
