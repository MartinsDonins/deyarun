/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker build optimization
  output: 'standalone',
  
  // Disable ESLint and TypeScript during build for deployment  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Production build optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // SECURITY: Strip ALL console statements in production builds
    if (!dev) {
      // Enhanced Terser configuration for console removal
      const TerserPlugin = require('terser-webpack-plugin');
      
      config.optimization.minimizer = config.optimization.minimizer.map(plugin => {
        if (plugin.constructor.name === 'TerserPlugin') {
          return new TerserPlugin({
            terserOptions: {
              ...plugin.options.terserOptions,
              compress: {
                ...plugin.options.terserOptions?.compress,
                // Remove ALL console statements
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
              }
            }
          });
        }
        return plugin;
      });
      
      // Additional DefinePlugin as fallback
      config.plugins.push(
        new webpack.DefinePlugin({
          'console.log': '(() => {})',
          'console.debug': '(() => {})',
          'console.info': '(() => {})',
          'console.warn': 'typeof window !== "undefined" && window.console ? console.warn : (() => {})',
          'console.error': 'typeof window !== "undefined" && window.console ? console.error : (() => {})'
        })
      );
    }
    return config;
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'localhost:3002', 'api.deyarun.com', 'runacademy.coredigify.com']
    }
  },
  // Note: 'output: standalone' removed for Vercel compatibility
  // Vercel handles Next.js builds natively and doesn't need standalone mode
  trailingSlash: false,
  // Optimizēt kešošanu un veiktspēju
  compress: true,
  poweredByHeader: false,
  // Cache headers optimizācija  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection', 
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googletagmanager.com *.google-analytics.com *.sentry.io *.firebase.app *.lgrckt-in.com cdn.lr-ingest.io cdn.logrocket.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' fonts.gstatic.com; connect-src 'self' *.firebase.app *.googleapis.com *.sentry.io *.lgrckt-in.com *.lr-ingest.io api.deyarun.com; frame-src 'self'; worker-src 'self' blob: data: *.logrocket.com cdn.logrocket.com;"
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/site.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ]
      }
    ]
  },
  async rewrites() {
    // Only use Docker backend proxy in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://backend:3001/api/:path*'
        }
      ]
    }
    return []
  }
}

module.exports = nextConfig

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "coredigify",
    project: "running-academy-web",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: true,
  }
);
