/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Allow images from Render-hosted URLs if you use next/image
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
