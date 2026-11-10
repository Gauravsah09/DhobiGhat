import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: '/book',
        destination: '/customer/book',
        permanent: false,
      },
      {
        source: '/portal',
        destination: '/customer',
        permanent: false,
      },
      {
        source: '/prices',
        destination: '/customer/rates',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
