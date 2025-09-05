import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API-only configuration
  output: 'standalone',
  experimental: {
    // Optimize for API routes
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Disable static optimization since we're API-only
  trailingSlash: false,
};

export default nextConfig;
