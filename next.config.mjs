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
    // Tell Vercel's bundler to include static data/template files used by
    // API routes via fs.readFileSync — without this they are stripped from
    // the serverless function bundle and any fs access returns 404.
    outputFileTracingIncludes: {
      '/api/**': [
        './src/templates/**',
        './src/data/**',
      ],
      // Include portfolio data for the homepage server component
      '/': ['./src/data/**'],
    },
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
