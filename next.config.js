/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (isDev ? 'http://127.0.0.1:8000' : 'https://realbuy-zzcu.onrender.com');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'images.pexels.com',
      'assets.stickpng.com',
      'm.media-amazon.com',
      'plus.unsplash.com',
      'realbuy-zzcu.onrender.com'
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
