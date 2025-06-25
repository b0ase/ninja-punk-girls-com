/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to avoid double rendering
  images: {
    unoptimized: true, // Disable image optimization to allow direct file access with special characters
    domains: ['localhost'],
  },
  // Allow more time for static generation
  staticPageGenerationTimeout: 180,
  // Workaround for OpenTelemetry issue
  experimental: {
    // Add serverComponentsExternalPackages back inside experimental
    serverComponentsExternalPackages: []
  },
  // Better output for debugging
  output: 'standalone',

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
};

module.exports = nextConfig; 