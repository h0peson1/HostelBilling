/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/dashboard',
        destination: '/student-dashboard.html',
      },
    ];
  },
};

module.exports = nextConfig;
