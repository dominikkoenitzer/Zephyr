import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Plugin to ensure react-vendor loads before vendor
function reorderChunks() {
  return {
    name: 'reorder-chunks',
    generateBundle(options, bundle) {
      // This will be handled in transformIndexHtml
    },
    transformIndexHtml(html) {
      // Reorder modulepreload links to ensure react-vendor loads before vendor
      const reactVendorRegex = /<link[^>]*react-vendor[^>]*>/g;
      const vendorRegex = /<link[^>]*vendor[^>]*>/g;
      const otherModulepreloadRegex = /<link[^>]*modulepreload[^>]*>/g;
      
      const reactVendorLinks = html.match(reactVendorRegex) || [];
      const vendorLinks = html.match(vendorRegex) || [];
      const otherLinks = html.match(otherModulepreloadRegex) || [];
      
      // Remove all modulepreload links
      html = html.replace(/<link[^>]*modulepreload[^>]*>/g, '');
      
      // Find the position before the main script tag
      const scriptMatch = html.match(/<script[^>]*type="module"[^>]*>/);
      if (scriptMatch) {
        const insertPos = scriptMatch.index;
        // Insert react-vendor first, then other vendors, then vendor
        const newLinks = [
          ...reactVendorLinks,
          ...otherLinks.filter(link => !link.includes('react-vendor') && !link.includes('vendor')),
          ...vendorLinks.filter(link => !link.includes('react-vendor'))
        ].join('\n    ');
        html = html.slice(0, insertPos) + newLinks + '\n    ' + html.slice(insertPos);
      }
      
      return html;
    }
  }
}

export default defineConfig({
  plugins: [react(), reorderChunks()],
  resolve: {
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
          
          // All other node_modules (should not contain React dependencies)
          // But be extra careful - if it imports react, put it in react-vendor
          if (id.includes('node_modules')) {
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

