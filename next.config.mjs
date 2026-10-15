/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'api.telegram.org'],
    unoptimized: true,
  },
};

export default nextConfig;
