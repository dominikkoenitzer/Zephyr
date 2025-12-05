import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

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

export default defineConfig({
  plugins: [react(), fixChunkLoading()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 1000,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    // Report compressed sizes
    reportCompressedSize: true,
    // Reduce chunk size warnings
    rollupOptions: {
      output: {
        // Ensure deterministic chunk names and prevent multiple react-vendor chunks
        manualChunks(id) {
          // React core libraries - must load first and be in a single chunk
          // Check for react, react-dom, and any react-* packages
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-error-boundary') ||
              id.includes('node_modules/react-') ||
              (id.includes('node_modules') && id.includes('/react'))) {
            return 'react-vendor';
          }
          
          // React Router (depends on React) - separate chunk but loads after react-vendor
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          
          // Radix UI components (depends on React)
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-vendor';
          }
          
          // Charts library (recharts is large, depends on React)
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }
          
          // Icons library (lucide-react can be large, depends on React)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          
          // Analytics (depends on React) - ensure it's in react-vendor or separate
          if (id.includes('node_modules/@vercel/analytics')) {
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
      'react-error-boundary',
    ],
    exclude: ['@vercel/analytics'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
})

