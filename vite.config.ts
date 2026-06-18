import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// CSP shared between dev server headers and production meta tag
const CSP_DIRECTIVES = [
  "default-src 'self' capacitor: http://localhost:*",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://accounts.google.com https://ssl.gstatic.com https://apis.google.com https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://ssl.gstatic.com https://accounts.google.com https://unpkg.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.googleapis.com https://ssl.gstatic.com https://ui-avatars.com https://unpkg.com https://server.arcgisonline.com https://*.tile.openstreetmap.org",
  [
    "connect-src 'self' data: blob:",
    "https://*.googleapis.com",
    "https://accounts.google.com",
    "https://*.firebaseio.com",
    "wss://*.firebaseio.com",
    "https://generativelanguage.googleapis.com",
    "https://api.openai.com",
    "https://api.anthropic.com",
    "https://*.sentry.io",
    "https://unpkg.com",
    "http://localhost:*",
  ].join(' '),
].join('; ');

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'Content-Security-Policy': CSP_DIRECTIVES,
      },
    },

    plugins: [react()],

    // Strip console.log/warn/info and debugger statements from production builds.
    // Errors still reach Sentry via its SDK, so console.error is not needed in prod.
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },

    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Third-party vendor splitting by package path
            if (id.includes('node_modules')) {
              // Firebase
              if (id.includes('/firebase/')) return 'vendor-firebase';
              // Charts (recharts + d3 internals)
              if (id.includes('/recharts/') || id.includes('/d3-')) return 'vendor-charts';
              // Map
              if (id.includes('/leaflet/')) return 'vendor-map';
              // Animation
              if (id.includes('/framer-motion/')) return 'vendor-motion';
              // Local DB
              if (id.includes('/dexie/')) return 'vendor-dexie';
              // AI SDK
              if (id.includes('/@google/generative-ai/')) return 'vendor-ai';
              // Schema validation
              if (id.includes('/zod/')) return 'vendor-zod';
              // React core — intentionally left to auto-bundle with main for perf
            }
          },
        },
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});

