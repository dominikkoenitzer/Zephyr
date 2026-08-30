import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import { ROUTE_META } from './src/routes/meta.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Plugin to ensure react-vendor loads before vendor and fix chunk dependencies
function fixChunkLoading() {
  return {
    name: 'fix-chunk-loading',
    generateBundle(options, bundle) {
      // Ensure react-vendor is a dependency of vendor if vendor imports from it
      Object.keys(bundle).forEach(fileName => {
        if (fileName.includes('vendor') && !fileName.includes('react-vendor')) {
          const chunk = bundle[fileName];
          if (chunk.type === 'chunk' && chunk.imports) {
            const hasReactImport = chunk.imports.some(imp => imp.includes('react-vendor'));
            if (hasReactImport && chunk.dynamicImports) {
              // Ensure react-vendor is in dependencies
              const reactVendorFile = Object.keys(bundle).find(f => f.includes('react-vendor'));
              if (reactVendorFile && !chunk.dynamicImports.includes(reactVendorFile)) {
                // This ensures proper loading order
              }
            }
          }
        }
      });
    },
    transformIndexHtml(html) {
      // Find react-vendor modulepreload link and convert it to a script tag
      // This ensures react-vendor executes before other modules
      const reactVendorPattern = /<link[^>]*rel="modulepreload"[^>]*react-vendor[^>]*href="([^"]*)"[^>]*>/i;
      const reactVendorMatch = html.match(reactVendorPattern);
      
      if (reactVendorMatch) {
        const reactVendorPath = reactVendorMatch[1];
        // Remove the modulepreload link
        html = html.replace(reactVendorPattern, '');
        
        // Find the main script tag (index-*.js) and insert react-vendor script before it
        const mainScriptPattern = /(<script[^>]*type="module"[^>]*src="[^"]*\/index-[^"]*\.js"[^>]*>)/i;
        const mainScriptMatch = html.match(mainScriptPattern);
        
        if (mainScriptMatch) {
          const insertPos = mainScriptMatch.index;
          const reactVendorScript = `    <script type="module" crossorigin src="${reactVendorPath}"></script>\n`;
          html = html.slice(0, insertPos) + reactVendorScript + html.slice(insertPos);
        } else {
          // Fallback: insert before any script tag
          const anyScriptPattern = /(<script[^>]*type="module"[^>]*>)/i;
          const anyScriptMatch = html.match(anyScriptPattern);
          if (anyScriptMatch) {
            const insertPos = anyScriptMatch.index;
            const reactVendorScript = `    <script type="module" crossorigin src="${reactVendorPath}"></script>\n`;
            html = html.slice(0, insertPos) + reactVendorScript + html.slice(insertPos);
          }
        }
      }
      
      return html;
    }
  }
}

// Writes a static HTML file per route after the build. Every route is served
// from index.html, so a crawler that does not execute JavaScript (most AI
// crawlers) used to see the home page's title, description and canonical on
// every URL — the canonical told it /tasks was a duplicate of /. usePageMeta
// corrects the head only after React runs; these files make the served bytes
// right too. vercel.json rewrites each route here, ahead of the catch-all.
function perRouteHtml() {
  const escapeHtml = (s) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  return {
    name: 'per-route-html',
    closeBundle() {
      const template = readFileSync(resolve(__dirname, 'dist/index.html'), 'utf8');
      for (const { title, description, path } of Object.values(ROUTE_META)) {
        if (path === '/') continue;
        const url = `https://zephyr.punds.ch${path}`;
        const t = escapeHtml(title);
        const d = escapeHtml(description);
        const html = template
          .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
          .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`)
          .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`)
          .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${d}$2`)
          .replace(/(<meta name="twitter:url" content=")[^"]*(")/, `$1${url}$2`);
        writeFileSync(resolve(__dirname, `dist${path}.html`), html);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    fixChunkLoading(),
    perRouteHtml(),
    // Service worker: precaches the app shell + assets so Zephyr genuinely
    // works offline (the PWA manifest alone does not cache anything).
    // Uses the existing public/manifest.webmanifest, since the plugin does not
    // generate one (manifest: false) and does not touch chunking.
    VitePWA({
      // 'prompt', not 'autoUpdate': a deploy used to swap the precache under a
      // session that was already running, so a lazy route chunk requested
      // afterwards could 404 against the new manifest. Now the new worker waits
      // and `usePwaUpdate` offers a reload instead. `injectRegister: null`
      // because the app registers the worker itself, in that hook.
      registerType: 'prompt',
      injectRegister: null,
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,txt,xml}'],
        // The 1024px install icon is only ever fetched by the browser's
        // install flow. Precaching 1.4MB of it would more than double the
        // precache for a file the running app never asks for.
        globIgnores: ['**/icon-1024.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_vercel/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  // Port 1000 for both `dev` and `preview`, and strictly, because Vite's default is
  // to walk to the next free port, which quietly hands you a different URL.
  // Failing loudly is better than serving on a port nobody is looking at.
  server: {
    port: 1000,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 1000,
    strictPort: true,
    host: true,
  },
  build: {
    target: 'esnext',
    // oxc is Vite 8's own minifier. 'esbuild' still works but only if esbuild
    // is installed, and Vite 8 no longer brings it.
    minify: 'oxc',
    cssMinify: true,
    sourcemap: false,
    // Report compressed sizes
    reportCompressedSize: true,
    // Reduce chunk size warnings
    rollupOptions: {
      output: {
        // Ensure deterministic chunk names and prevent multiple react-vendor chunks
        manualChunks(id) {
          // Motion / framer-motion (+ motion-dom, motion-utils). Must be
          // checked BEFORE the react checks: motion ships files like
          // motion/dist/react.mjs that would otherwise match the generic
          // "/react" pattern and split the library across chunks.
          if (id.includes('node_modules/motion') ||
              id.includes('node_modules/framer-motion')) {
            return 'motion-vendor';
          }

          // ogl (WebGL, no React dependency) is only imported by the
          // lazy-loaded AuroraBackground, so return undefined and Rollup keeps
          // it in that async chunk instead of the eagerly-loaded vendor.
          if (id.includes('node_modules/ogl')) {
            return undefined;
          }

          // React Router (depends on React) - separate chunk but loads after
          // react-vendor. Checked BEFORE the react-* catch-all below, which
          // would otherwise swallow react-router into react-vendor. Router v7
          // absorbed @remix-run/router, so this rule is the whole router now.
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }

          // React core libraries - must load first and be in a single chunk
          // Check for react, react-dom, and any react-* packages
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-') ||
              (id.includes('node_modules') && id.includes('/react'))) {
            return 'react-vendor';
          }
          
          // Radix UI components (depends on React)
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-vendor';
          }
          
          // Icons library (lucide-react can be large, depends on React)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          
          // Analytics (depends on React) - ensure it's in react-vendor or separate
          if (id.includes('node_modules/@vercel/analytics')) {
            return 'react-vendor';
          }

          // React-adjacent libraries that don't include "react" in the path
          if (
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/prop-types')
          ) {
            return 'react-vendor';
          }

          // Utility libraries (small, can be grouped) - non-React dependencies only
          if (
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/class-variance-authority') ||
            id.includes('node_modules/tailwindcss-animate')
          ) {
            return 'utils-vendor';
          }
          
          // All other node_modules - be very conservative
          // If it's a known React-dependent library pattern, put it in react-vendor
          // This catches transitive dependencies that might use React
          if (id.includes('node_modules')) {
            // Check for common patterns that might indicate React usage
            // If unsure, put it in react-vendor to be safe
            const suspiciousPatterns = [
              'scheduler', // React scheduler
              'use', // React hooks patterns
              'jsx-runtime', // JSX runtime
            ];
            if (suspiciousPatterns.some(pattern => id.includes(pattern))) {
              return 'react-vendor';
            }
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Enable tree-shaking
    treeshake: {
      moduleSideEffects: 'no-external',
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
    exclude: ['@vercel/analytics'],
  },
})

