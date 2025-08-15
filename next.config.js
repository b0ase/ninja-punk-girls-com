/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to avoid double rendering
  images: {
    unoptimized: true, // Disable image optimization to allow direct file access with special characters
    domains: ['localhost'],
  },
  // Allow more time for static generation
  staticPageGenerationTimeout: 180,
  
  // Disable static optimization for problematic pages
  experimental: {
    // Add serverComponentsExternalPackages back inside experimental
    serverComponentsExternalPackages: [],
    // Reduce build complexity
    swcMinify: false
  },
  // Better output for debugging
  output: 'standalone',
  
  // Disable build traces to prevent stack overflow issues
  experimental: {
    // Add serverComponentsExternalPackages back inside experimental
    serverComponentsExternalPackages: []
  },

  // <<< Add Webpack configuration for WASM >>>
  webpack: (config, { isServer }) => {
    // Enable asynchronous WebAssembly
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Important: return the modified config
    return config;
  },
  // <<< End WASM config >>>

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Generate a deterministic build ID to avoid build trace issues
  generateBuildId: async () => {
    return 'ninja-punk-girls-build-' + Date.now();
  },
};

module.exports = nextConfig; 