const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV !== 'production',

  reloadOnOnline: true,

  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    navigateFallback: '/',
  },
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  env: {
    REACT_APP_IMAGES_PATH: '/assets/images',
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/en-US/dashboard',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/manifest.json',
        destination: '/api/manifest?lang=en-US',
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
