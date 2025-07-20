
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standard .next directory
  distDir: '.next',
  
  // Remove problematic experimental features that prevent routes-manifest.json generation
  experimental: {
    // Keep experimental features minimal for Vercel compatibility
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Keep images unoptimized for compatibility
  images: { 
    unoptimized: true 
  },
  
  // Ensure proper static generation and routing
  trailingSlash: false,
  
  // Optimize for Vercel deployment
  poweredByHeader: false,
  
  // Fix recharts SSR issues
  transpilePackages: ['recharts'],
};

module.exports = nextConfig;
// Emergency deployment trigger Sun Jul 20 20:51:25 UTC 2025
// EMERGENCY: Fixed Vercel build command - Sun Jul 20 20:53:36 UTC 2025
