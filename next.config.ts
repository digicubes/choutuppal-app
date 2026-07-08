import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: () => 'fresh-build-' + Date.now(),
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  reactStrictMode: true,
  // Allow cross-origin requests from the preview panel
  // Next.js uses wildcard domain matching via matchWildcardDomain()
  // '*.space-z.ai' matches any subdomain of space-z.ai
  allowedDevOrigins: [
    '*.space-z.ai',
    '*.z.ai',
    'space-z.ai',
    'z.ai',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
