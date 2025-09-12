import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment configuration
  // Remove standalone output for Vercel
  // output: 'standalone', // Only for Docker deployments
  // Optimize for API routes
  serverExternalPackages: ['@supabase/supabase-js'],
  // Enable static file serving for frontend
  trailingSlash: false,
  // Ensure proper API route handling
  experimental: {
    // Enable if needed for your specific use case
  },
};

export default nextConfig;
