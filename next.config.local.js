
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standard .next directory
  distDir: '.next',
  
  // Optimize for local development performance
  experimental: {
    // Enable faster builds for local development
    turbo: {
      // Skip type checking during development
      rules: {
        // Bypass heavy processing
      }
    }
  },
  
  // Skip linting and type checking during local development builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Allow builds to continue with type errors locally
  },
  
  // Keep images unoptimized for faster local builds
  images: { 
    unoptimized: true 
  },
  
  // Reduce build overhead
  trailingSlash: false,
  poweredByHeader: false,
  
  // Optimize for local development speed
  transpilePackages: ['recharts'],
  
  // Development-specific optimizations
  swcMinify: false, // Disable minification for faster builds
  
  // Disable static optimization for faster hot reloads
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Local development webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Optimize for development speed
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Reduce memory usage in development
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
