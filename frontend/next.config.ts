/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['172.16.17.183'],
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: 'https://pawzo-ajf9.onrender.com/auth/:path*' },
      { source: '/pets/:path*', destination: 'https://pawzo-ajf9.onrender.com/pets/:path*' },
      { source: '/user/:path*', destination: 'https://pawzo-ajf9.onrender.com/user/:path*' },
      { source: '/push/:path*', destination: 'https://pawzo-ajf9.onrender.com/push/:path*' },
    ];
  },
};

module.exports = nextConfig;
