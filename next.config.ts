import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ["sharp"],
  outputFileTracingRoot: path.join(__dirname, './'),
  outputFileTracingIncludes: {
    '/api/compile': ['./bin/typst', './public/**/*'],
  },
};

export default nextConfig;
