/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["img1.wsimg.com"],
  },
  async headers() {
    return [
      {
        // HTML pages — never cache, always revalidate
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
