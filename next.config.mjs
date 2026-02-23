/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  output: isGithubPages ? 'export' : undefined,
  basePath: isGithubPages ? '/Matrixboss' : '',
  assetPrefix: isGithubPages ? '/Matrixboss/' : '',
  // Expose GitHub Pages flag to the browser bundle
  env: {
    NEXT_PUBLIC_GITHUB_PAGES: isGithubPages ? 'true' : '',
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/generated_resumes', '**/.git', '**/venv', '**/temp_coursework'],
      }
    }
    // Disable caching that might cause permission issues
    config.cache = false
    return config
  },
};

export default nextConfig;
