/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['172.16.17.183'],
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: 'http://localhost:8000/auth/:path*' },
      { source: '/pets/:path*', destination: 'http://localhost:8000/pets/:path*' },
      { source: '/user/:path*', destination: 'http://localhost:8000/user/:path*' },
    ];
  },
};

module.exports = nextConfig;
