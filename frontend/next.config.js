/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The shared workspace package ships TS source. Tell Next to transpile it
  // so Vercel and other build environments can consume it directly.
  transpilePackages: ['@veda-ai/shared'],
};

module.exports = nextConfig;
