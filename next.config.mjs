/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Dev: fewer full-page reloads
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,   // 1 hour — keep pages compiled
    pagesBufferLength: 5,
  },

  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },

  // Reduce source-map cost in dev
  productionBrowserSourceMaps: false,
};

export default nextConfig;
