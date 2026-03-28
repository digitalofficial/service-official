/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: [
    '@service-official/database',
    '@service-official/types',
    '@service-official/ui',
    '@service-official/utils',
    '@service-official/auth',
    '@service-official/notifications',
    '@service-official/billing',
    '@service-official/workflows',
    '@service-official/ai',
  ],
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'sharp'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/portal/:path*',
        destination: '/public/portal/:path*',
      },
      {
        source: '/book/:path*',
        destination: '/public/booking/:path*',
      },
    ]
  },
}

module.exports = nextConfig
